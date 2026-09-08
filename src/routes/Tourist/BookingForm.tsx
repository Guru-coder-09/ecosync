import React, { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Car,
  Users,
  Calendar,
  Clock,
  Minus,
  Plus,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { YieldBanner } from './YieldBanner';
import { CapacityBar } from '../../components/CapacityBar';
import {
  capacityPct,
  formatISTDate,
  formatISTTime,
  utcToISTInput,
  istInputToUTC,
  validateVehicleReg,
  formatVehicleReg,
  cn,
  statusBadgeClass,
  hazardBadgeClass,
} from '../../lib/utils';
import { useZoneStore } from '../../stores/zoneStore';
import type { Zone, BookingFormData } from '../../lib/types';

interface BookingFormProps {
  zone: Zone;
  onSubmit: (data: BookingFormData) => void;
  onBack: () => void;
  loading: boolean;
  applyDiscount?: boolean;
}

const SLOT_DURATION_HOURS = 6;
const MIN_ADVANCE_MINUTES = 30;
const MAX_PASSENGERS = 10;
const MIN_PASSENGERS = 1;

function getNowPlusMinutes(mins: number): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + mins);
  return d;
}

function addHours(dateIso: string, hours: number): string {
  const d = new Date(dateIso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function toLocalDatetimeInputValue(utcIso: string): string {
  // utcToISTInput: converts UTC ISO to IST datetime-local string
  return utcToISTInput(utcIso);
}

interface FieldError {
  vehicle?: string;
  passengerCount?: string;
  slotStart?: string;
  slotEnd?: string;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  zone,
  onSubmit,
  onBack,
  loading,
  applyDiscount = false,
}) => {
  const { zones } = useZoneStore();
  const capacityPercent = capacityPct(zone.current_occupancy, zone.safe_capacity);
  const isHighDemand = capacityPercent >= 85;

  // Default slot_start: now + 30 min, rounded to next 15 min
  const defaultStart = (() => {
    const d = getNowPlusMinutes(MIN_ADVANCE_MINUTES);
    d.setSeconds(0, 0);
    const rem = d.getMinutes() % 15;
    if (rem !== 0) d.setMinutes(d.getMinutes() + (15 - rem));
    return d.toISOString();
  })();

  const [vehicleReg, setVehicleReg] = useState('');
  const [vehicleRegFormatted, setVehicleRegFormatted] = useState('');
  const [passengerCount, setPassengerCount] = useState(2);
  const [slotStartIST, setSlotStartIST] = useState(toLocalDatetimeInputValue(defaultStart));
  const [slotEndIST, setSlotEndIST] = useState(
    toLocalDatetimeInputValue(addHours(defaultStart, SLOT_DURATION_HOURS))
  );
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Keep slot_end in sync when slot_start changes (auto-calc end = start + 6h)
  const handleSlotStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const istVal = e.target.value;
      setSlotStartIST(istVal);
      try {
        const utcStart = istInputToUTC(istVal);
        const utcEnd = addHours(utcStart, SLOT_DURATION_HOURS);
        setSlotEndIST(toLocalDatetimeInputValue(utcEnd));
      } catch {
        // ignore parse errors mid-type
      }
    },
    []
  );

  const handleVehicleBlur = useCallback(() => {
    setTouched((t) => ({ ...t, vehicle: true }));
    if (vehicleReg.trim()) {
      const formatted = formatVehicleReg(vehicleReg.trim().toUpperCase());
      setVehicleReg(formatted);
      setVehicleRegFormatted(formatted);
    }
  }, [vehicleReg]);

  const validate = useCallback((): FieldError => {
    const errs: FieldError = {};
    const reg = vehicleReg.trim().toUpperCase();
    if (!reg) {
      errs.vehicle = 'Vehicle registration number is required.';
    } else if (!validateVehicleReg(reg)) {
      errs.vehicle = 'Enter a valid Indian vehicle number (e.g. MH-12-AB-1234).';
    }
    if (passengerCount < MIN_PASSENGERS || passengerCount > MAX_PASSENGERS) {
      errs.passengerCount = `Passenger count must be between ${MIN_PASSENGERS} and ${MAX_PASSENGERS}.`;
    }
    const minStart = getNowPlusMinutes(MIN_ADVANCE_MINUTES);
    let startUtc: string | null = null;
    try {
      startUtc = istInputToUTC(slotStartIST);
      if (new Date(startUtc) < minStart) {
        errs.slotStart = `Slot must start at least ${MIN_ADVANCE_MINUTES} minutes from now.`;
      }
    } catch {
      errs.slotStart = 'Invalid slot start date/time.';
    }
    let endUtc: string | null = null;
    try {
      endUtc = istInputToUTC(slotEndIST);
      if (startUtc && endUtc && new Date(endUtc) <= new Date(startUtc)) {
        errs.slotEnd = 'Slot end must be after slot start.';
      }
    } catch {
      errs.slotEnd = 'Invalid slot end date/time.';
    }
    return errs;
  }, [vehicleReg, passengerCount, slotStartIST, slotEndIST]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = { vehicle: true, passengerCount: true, slotStart: true, slotEnd: true };
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const slotStartUTC = istInputToUTC(slotStartIST);
    const slotEndUTC = istInputToUTC(slotEndIST);

    onSubmit({
      zone_id: zone.id,
      vehicle_reg_number: vehicleReg.trim().toUpperCase(),
      passenger_count: passengerCount,
      slot_start: slotStartUTC,
      slot_end: slotEndUTC,
      apply_discount: applyDiscount && isHighDemand,
    });
  };

  // Revalidate on change after user has touched fields
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validate());
    }
  }, [vehicleReg, passengerCount, slotStartIST, slotEndIST, touched, validate]);

  const minIST = toLocalDatetimeInputValue(getNowPlusMinutes(MIN_ADVANCE_MINUTES).toISOString());

  const alternativeZones = zones.filter(
    (z) => z.id !== zone.id && z.status !== 'CLOSED'
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Zone summary card */}
      <div className="rounded-xl border border-navy-200 bg-navy-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 flex-shrink-0 text-navy-900" aria-hidden="true" />
              <h3 className="truncate text-base font-bold text-navy-900">{zone.name}</h3>
            </div>
            <p className="mt-0.5 text-xs text-navy-900/70">{zone.state}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                statusBadgeClass(zone.status)
              )}
            >
              {zone.status}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                hazardBadgeClass(zone.hazard_level)
              )}
            >
              {zone.hazard_level}
            </span>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-navy-900/70">
            <span>Capacity</span>
            <span className="tabular-nums font-medium">
              {zone.current_occupancy} / {zone.safe_capacity}
            </span>
          </div>
          <CapacityBar
            current={zone.current_occupancy}
            capacity={zone.safe_capacity}
            className="w-full"
          />
        </div>
      </div>

      {/* Yield Banner */}
      {isHighDemand && (
        <YieldBanner
          selectedZone={zone}
          alternativeZones={alternativeZones}
          onSelectAlternative={() => onBack()}
          discount={20}
        />
      )}

      {/* Vehicle Registration */}
      <div>
        <label
          htmlFor="vehicle-reg"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
        >
          <Car className="h-4 w-4 text-navy-900" aria-hidden="true" />
          Vehicle Registration Number
          <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="mt-1.5 relative">
          <input
            id="vehicle-reg"
            type="text"
            value={vehicleReg}
            onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
            onBlur={handleVehicleBlur}
            placeholder="MH-12-AB-1234"
            maxLength={13}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby={errors.vehicle ? 'vehicle-error' : 'vehicle-hint'}
            aria-invalid={!!errors.vehicle}
            className={cn(
              'block w-full rounded-lg border px-3 py-2.5 text-sm font-mono tracking-widest shadow-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900',
              errors.vehicle && touched.vehicle
                ? 'border-red-400 bg-red-50 text-red-900 placeholder-red-300'
                : vehicleRegFormatted && !errors.vehicle
                ? 'border-eco-800 bg-green-50'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
            )}
          />
          {vehicleRegFormatted && !errors.vehicle && (
            <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-eco-800" aria-hidden="true" />
          )}
        </div>
        {errors.vehicle && touched.vehicle ? (
          <p id="vehicle-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {errors.vehicle}
          </p>
        ) : (
          <p id="vehicle-hint" className="mt-1 text-xs text-gray-400">
            Indian format: XX-00-XXX-0000 (auto-formatted on blur)
          </p>
        )}
      </div>

      {/* Passenger Count */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Users className="h-4 w-4 text-navy-900" aria-hidden="true" />
          Number of Passengers
          <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="mt-1.5 flex items-center gap-3">
          <button
            type="button"
            aria-label="Decrease passenger count"
            disabled={passengerCount <= MIN_PASSENGERS}
            onClick={() => setPassengerCount((c) => Math.max(MIN_PASSENGERS, c - 1))}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-navy-900"
          >
            <Minus className="h-4 w-4 text-gray-700" aria-hidden="true" />
          </button>
          <input
            type="number"
            min={MIN_PASSENGERS}
            max={MAX_PASSENGERS}
            value={passengerCount}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) setPassengerCount(Math.min(MAX_PASSENGERS, Math.max(MIN_PASSENGERS, v)));
            }}
            onBlur={() => setTouched((t) => ({ ...t, passengerCount: true }))}
            aria-label="Passenger count"
            aria-invalid={!!errors.passengerCount}
            className={cn(
              'h-10 w-20 rounded-lg border px-3 text-center text-base font-semibold shadow-sm tabular-nums',
              'focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900',
              errors.passengerCount && touched.passengerCount
                ? 'border-red-400 bg-red-50 text-red-900'
                : 'border-gray-300 bg-white text-gray-900'
            )}
          />
          <button
            type="button"
            aria-label="Increase passenger count"
            disabled={passengerCount >= MAX_PASSENGERS}
            onClick={() => setPassengerCount((c) => Math.min(MAX_PASSENGERS, c + 1))}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-navy-900"
          >
            <Plus className="h-4 w-4 text-gray-700" aria-hidden="true" />
          </button>
          <span className="text-sm text-gray-500">/ {MAX_PASSENGERS} max</span>
        </div>
        {errors.passengerCount && touched.passengerCount && (
          <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {errors.passengerCount}
          </p>
        )}
      </div>

      {/* Slot Start */}
      <div>
        <label
          htmlFor="slot-start"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
        >
          <Calendar className="h-4 w-4 text-navy-900" aria-hidden="true" />
          Entry Date & Time (IST)
          <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="slot-start"
          type="datetime-local"
          value={slotStartIST}
          min={minIST}
          onChange={handleSlotStartChange}
          onBlur={() => setTouched((t) => ({ ...t, slotStart: true }))}
          aria-describedby={errors.slotStart ? 'slot-start-error' : undefined}
          aria-invalid={!!errors.slotStart}
          className={cn(
            'mt-1.5 block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900',
            errors.slotStart && touched.slotStart
              ? 'border-red-400 bg-red-50 text-red-900'
              : 'border-gray-300 bg-white text-gray-900'
          )}
        />
        {errors.slotStart && touched.slotStart && (
          <p id="slot-start-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {errors.slotStart}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          All times in Indian Standard Time (IST, UTC+5:30). Minimum {MIN_ADVANCE_MINUTES} min advance booking.
        </p>
      </div>

      {/* Slot End */}
      <div>
        <label
          htmlFor="slot-end"
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
        >
          <Clock className="h-4 w-4 text-navy-900" aria-hidden="true" />
          Exit Date & Time (IST)
          <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="slot-end"
          type="datetime-local"
          value={slotEndIST}
          min={slotStartIST}
          onChange={(e) => {
            setSlotEndIST(e.target.value);
            setTouched((t) => ({ ...t, slotEnd: true }));
          }}
          onBlur={() => setTouched((t) => ({ ...t, slotEnd: true }))}
          aria-describedby={errors.slotEnd ? 'slot-end-error' : 'slot-end-hint'}
          aria-invalid={!!errors.slotEnd}
          className={cn(
            'mt-1.5 block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-navy-900',
            errors.slotEnd && touched.slotEnd
              ? 'border-red-400 bg-red-50 text-red-900'
              : 'border-gray-300 bg-white text-gray-900'
          )}
        />
        {errors.slotEnd && touched.slotEnd ? (
          <p id="slot-end-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            {errors.slotEnd}
          </p>
        ) : (
          <p id="slot-end-hint" className="mt-1 text-xs text-gray-400">
            Auto-set to {SLOT_DURATION_HOURS} hours after entry. You may adjust.
          </p>
        )}
      </div>

      {/* Discount note */}
      {applyDiscount && isHighDemand && (
        <div className="flex items-center gap-2 rounded-lg bg-eco-800/10 px-3 py-2 text-sm text-eco-800">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>
            <strong>20% ecological discount</strong> will be applied to this permit.
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Zones
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-saffron-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-saffron-900 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Generating E-Pass…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Confirm & Generate E-Pass
            </>
          )}
        </button>
      </div>
    </form>
  );
};
