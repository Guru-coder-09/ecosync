"""
EcoSync Python Cryptographic Engine — Ed25519 (EdDSA)
Generates and holds the asymmetric keypair server-side.
Signs compact JWS permits and outputs JWK for offline guard verification.
"""

import base64
import json
import time
from typing import Dict, Any, Tuple
from cryptography.hazmat.primitives.asymmetric import ed25519

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data.encode('utf-8'))

class Ed25519PermitSigner:
    def __init__(self):
        # Generate or load persistent server-side private key
        self.private_key = ed25519.Ed25519PrivateKey.generate()
        self.public_key = self.private_key.public_key()
        self.raw_public_bytes = self.public_key.public_bytes_raw()

    def get_public_jwk(self) -> Dict[str, str]:
        """Returns public JWK format matching RFC 8037 (safe for offline Guard caching)"""
        return {
            "kty": "OKP",
            "crv": "Ed25519",
            "x": base64url_encode(self.raw_public_bytes)
        }

    def current_salt(self) -> int:
        """30-second rolling TOTP window (UTC-based)"""
        return int(time.time() // 30)

    def sign_permit(self, payload: Dict[str, Any]) -> Tuple[str, int]:
        """
        Signs permit payload with Ed25519 and returns (compact_jwt, salt).
        """
        salt = self.current_salt()
        full_payload = {
            **payload,
            "salt": salt,
            "iss": "ecosync-dpi-goi-fastapi",
            "iat": int(time.time()),
        }

        # Compact JWT: Header.Payload.Signature
        header = {"alg": "EdDSA", "typ": "JWT"}
        header_b64 = base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
        payload_b64 = base64url_encode(json.dumps(full_payload, separators=(',', ':')).encode('utf-8'))
        
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        signature = self.private_key.sign(signing_input)
        sig_b64 = base64url_encode(signature)

        token = f"{signing_input.decode('utf-8')}.{sig_b64}"
        return token, salt

    def verify_permit(self, token: str) -> Dict[str, Any]:
        """
        Server-side mathematical verification with ±1 grace window.
        """
        parts = token.split('.')
        if len(parts) != 3:
            return {"valid": False, "reason": "INVALID_FORMAT"}

        header_b64, payload_b64, sig_b64 = parts
        try:
            signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
            signature = base64url_decode(sig_b64)
            self.public_key.verify(signature, signing_input)

            payload = json.loads(base64url_decode(payload_b64).decode('utf-8'))
            
            # Expiry check
            now_sec = int(time.time())
            if payload.get("exp", 0) < now_sec:
                return {"valid": False, "reason": "EXPIRED", "payload": payload}

            # Clock-skew check (±1 interval window = 30s grace)
            curr = self.current_salt()
            client_salt = payload.get("salt", 0)
            if client_salt not in (curr, curr - 1):
                return {"valid": False, "reason": "CLOCK_DRIFT", "payload": payload}

            return {"valid": True, "reason": "VERIFIED", "payload": payload}
        except Exception as e:
            return {"valid": False, "reason": "TAMPERED", "error": str(e)}

# Global singleton
signer = Ed25519PermitSigner()
