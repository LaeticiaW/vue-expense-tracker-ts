import Vue from 'vue'

export interface BaseExpense {   
    trxDate: string
    trxMonth?: number
    trxYear?: number
    categoryId?: string | null
    categoryName?: string
    subcategoryId?: string
    subcategoryName?: string
    amount: number
    description: string
}

export interface Expense extends BaseExpense {
    _id: string   
    importId?: string
}

export interface FormExpense extends BaseExpense {
    _id?: string
}

export interface ExpenseTimeseries {
    categoryId: string | null
    categoryName: string | null
    totalAmount: number
    trxYear: number
    trxMonth: number
    _id: {
        categoryId: string | null
        trxYear: number
        trxMonth: number
    }
}

export interface ExpenseSummary {
    categoryId: string
    categoryName: string
    totalAmount: number
    percent?: number
    subcategoryTotals: SubcategoryTotal[]
}

export interface SubcategoryTotal {
    subcategoryId: string | null
    subcategoryName: string | null
    totalAmount: number | null
}

export interface ExpenseSummaryRaw {
    _id: {
        categoryId: string
        subcategoryId: string | null
    }
    categoryName: string
    subcategoryName: string | null
    totalAmount: number
}

export interface ExpenseFilter {
    startDate: string | null
    endDate: string | null
    categoryIds: string[] | null
}