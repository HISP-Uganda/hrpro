package payroll

func CalculateGrossPay(baseSalary, allowancesTotal float64) float64 {
	return baseSalary + allowancesTotal
}

func CalculateNetPay(grossPay, deductionsTotal, taxTotal float64) float64 {
	return grossPay - deductionsTotal - taxTotal
}

func CalculateTotals(baseSalary, allowancesTotal, deductionsTotal, taxTotal float64) (grossPay float64, netPay float64) {
	grossPay = CalculateGrossPay(baseSalary, allowancesTotal)
	netPay = CalculateNetPay(grossPay, deductionsTotal, taxTotal)
	return grossPay, netPay
}
