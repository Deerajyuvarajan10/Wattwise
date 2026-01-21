/**
 * Tamil Nadu Electricity Slab Rate Calculator
 * Frontend utility for accurate cost calculations
 */

// Tamil Nadu domestic electricity slab rates (bi-monthly billing)
const TAMILNADU_SLABS_BIMONTHLY = [
    { min: 0, max: 100, rate: 0.00 },      // Free (for 2 months)
    { min: 101, max: 200, rate: 2.35 },
    { min: 201, max: 400, rate: 4.70 },
    { min: 401, max: 500, rate: 6.30 },
    { min: 501, max: 600, rate: 8.40 },
    { min: 601, max: 800, rate: 9.45 },
    { min: 801, max: 1000, rate: 10.50 },
    { min: 1001, max: Infinity, rate: 11.55 },
];

interface BillBreakdown {
    slab: string;
    units: number;
    rate: number;
    amount: number;
}

interface BillCalculation {
    total_units: number;
    total_amount: number;
    average_rate: number;
    breakdown: BillBreakdown[];
}

/**
 * Calculate bi-monthly bill using Tamil Nadu slab rates
 */
export function calculateBimonthlyBill(totalUnits: number): BillCalculation {
    totalUnits = Math.max(0, totalUnits);
    let remainingUnits = totalUnits;
    let totalCost = 0;
    const breakdown: BillBreakdown[] = [];

    for (const slab of TAMILNADU_SLABS_BIMONTHLY) {
        if (remainingUnits <= 0) break;

        const slabMin = slab.min;
        const slabMax = slab.max;
        const rate = slab.rate;

        // Calculate units in this slab
        const slabRange = slabMax === Infinity ? remainingUnits : slabMax - slabMin + 1;
        const unitsInSlab = Math.min(remainingUnits, slabRange);

        // Calculate cost for this slab
        const slabCost = unitsInSlab * rate;
        totalCost += slabCost;

        if (unitsInSlab > 0) {
            breakdown.push({
                slab: `${slabMin}-${slabMax === Infinity ? '∞' : slabMax}`,
                units: Math.round(unitsInSlab * 100) / 100,
                rate: rate,
                amount: Math.round(slabCost * 100) / 100,
            });
        }

        remainingUnits -= unitsInSlab;
    }

    const avgRate = totalUnits > 0 ? totalCost / totalUnits : 0;

    return {
        total_units: Math.round(totalUnits * 100) / 100,
        total_amount: Math.round(totalCost * 100) / 100,
        average_rate: Math.round(avgRate * 100) / 100,
        breakdown,
    };
}

/**
 * Calculate monthly bill (estimates by projecting to bi-monthly)
 */
export function calculateMonthlyBill(monthlyUnits: number): BillCalculation {
    // Project to bi-monthly for accurate slab calculation
    const bimonthlyUnits = monthlyUnits * 2;
    const bimonthlyBill = calculateBimonthlyBill(bimonthlyUnits);

    // Monthly estimate is half of bi-monthly
    return {
        total_units: Math.round(monthlyUnits * 100) / 100,
        total_amount: Math.round((bimonthlyBill.total_amount / 2) * 100) / 100,
        average_rate: bimonthlyBill.average_rate,
        breakdown: bimonthlyBill.breakdown,
    };
}

/**
 * Calculate daily cost based on estimated monthly usage
 */
export function calculateDailyCost(dailyKwh: number, monthlyEstimateKwh?: number): number {
    if (monthlyEstimateKwh === undefined) {
        monthlyEstimateKwh = dailyKwh * 30;
    }

    const monthlyBill = calculateMonthlyBill(monthlyEstimateKwh);

    // Calculate daily cost proportionally
    const dailyCost = monthlyEstimateKwh > 0
        ? (dailyKwh / monthlyEstimateKwh) * monthlyBill.total_amount
        : 0;

    return Math.round(dailyCost * 100) / 100;
}

/**
 * Get average rate for a given daily consumption
 * This is useful for displaying "effective rate" to users
 */
export function getAverageRate(dailyKwh: number): number {
    const monthlyKwh = dailyKwh * 30;
    const monthlyBill = calculateMonthlyBill(monthlyKwh);
    return monthlyBill.average_rate;
}
