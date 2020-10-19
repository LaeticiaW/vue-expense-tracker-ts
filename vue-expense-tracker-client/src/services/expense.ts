import axios from 'axios'
import dayjs from 'dayjs'
import numeral from 'numeral'
import _ from 'lodash-core'
import { Expense, FormExpense, ExpenseSummary, ExpenseSummaryRaw, ExpenseFilter, 
    ExpenseTimeseries, Series, ImportDetails, ImportExpense } from '@/types/index.ts'

export default {
    expenseUrl: 'http://localhost:3000/expense/' as string,

    /*
     * Retrieve the expense list
     * @param {object} filter - filter values to use when retrieving the expenses
     */
    getExpenses(filter : ExpenseFilter) {
        return axios.get(this.expenseUrl, {
            params: {
                startDate: filter.startDate,
                endDate: filter.endDate,
                categoryIds: filter.categoryIds
            }
        }).then((response) => {
            const expenses = response.data
            return expenses
        }).catch((error) => {
            console.error('ExpenseService.getExpenses error:', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Save an expense, either via create or update
     * @param {object} expense - expense object to save
     */
    saveExpense(expense : FormExpense) : Promise<Expense> {
        if (expense._id === undefined) {
            return this.createExpense(expense)
        }
        return this.updateExpense(expense)
    },

    /*
     * Create a new expense
     * @param {object} expense - expense object to save
     */
    createExpense(expense : FormExpense) : Promise<Expense> {
        return axios({
            url: this.expenseUrl,
            method: 'POST',
            data: expense
        }).then((response) => response.data).catch((error) => {
            console.error('ExpenseService.createExpense error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Update an existing expense
     * @param {object} expense - expense object to update
     */
    updateExpense(expense : FormExpense) : Promise<Expense> {
        return axios({
            url: this.expenseUrl + expense._id,
            method: 'PUT',
            data: expense
        }).then((response) => response.data).catch((error) => {
            console.error('ExpenseService.updateExpense error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Delete an expense
     * @param {string} expenseId - id of expense to delete
     */
    deleteExpense(expenseId : string | undefined) {
        return axios({
            url: this.expenseUrl + expenseId,
            method: 'DELETE'
        }).then((response) => response.data).catch((error) => {
            console.error('ExpenseService.deleteExpense error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Get expense totals by categories and subcategory
     * @param {object} filter - filter values to use when retrieving the expense totals
     */
    getExpenseTotals(filter : ExpenseFilter) {
        return axios.get(`${this.expenseUrl}totals`, {
            params: {
                startDate: filter.startDate,
                endDate: filter.endDate,
                categoryIds: filter.categoryIds ? filter.categoryIds : null
            }
        }).then((response) => {
            const subcatTotals : ExpenseSummaryRaw[] = response.data

            // Reformat the list, calculating the total for each category, and moving the subcategory totals to an object
            let prevCatId: string = ''
            let totalExpensesAmount: number = 0
            const expenseTotals: ExpenseSummary[] = []
            let categoryRecord : ExpenseSummary = {
                categoryId: '',
                categoryName: '',
                totalAmount: 0,
                subcategoryTotals: []
            }
            subcatTotals.forEach((record : ExpenseSummaryRaw) => {
                const { categoryId } = record._id
                const { categoryName } = record
                const { subcategoryId } = record._id
                const { subcategoryName } = record
                const { totalAmount } = record

                if (categoryId !== prevCatId) {
                    if (prevCatId !== '') {
                        expenseTotals.push(_.cloneDeep(categoryRecord))
                    }
                    categoryRecord = {
                        categoryId,
                        categoryName,
                        totalAmount,
                        subcategoryTotals: []
                    }
                    prevCatId = categoryId
                } else {
                    categoryRecord.totalAmount += totalAmount
                }

                if (subcategoryId) {
                    categoryRecord.subcategoryTotals.push({
                        subcategoryId,
                        subcategoryName,
                        totalAmount
                    })
                }

                totalExpensesAmount += totalAmount
            })

            if (categoryRecord) {
                expenseTotals.push(_.cloneDeep(categoryRecord))
            }

            // Calculate the percent for each total Amount
            expenseTotals.forEach((exp : ExpenseSummary) => {
                exp.percent = exp.totalAmount / totalExpensesAmount * 100
            })

            return expenseTotals
        }).catch((error) => {
            console.error('ExpenseService.getExpenseTotals error:', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Get expense totals by categories and subcategory
     * @param {object} filter - filter values to uwe when retrieving the expense time series data
     */
    getExpenseTimeSeries(filter : ExpenseFilter) : Promise<Series[]> {
        return axios.get(`${this.expenseUrl}timeseries`, {
            params: {
                startDate: filter.startDate,
                endDate: filter.endDate,
                categoryIds: filter.categoryIds ? filter.categoryIds : null
            }
        }).then((response) => {
            const expenses : ExpenseTimeseries[] = response.data

            // Convert to Highcharts time series format, one time series per categories
            const series: Series[] = []
            let seriesObj: Series = { name: '', data: []}
            let prevCatId : string | null = ''
            let prevCatName : string | null  = ''
            let data : [number, number][] = []
            let dt : number
            expenses.forEach((exp : ExpenseTimeseries) => {
                if (exp.categoryId !== prevCatId && prevCatId !== '') {
                    seriesObj = {
                        name: prevCatName,
                        data: data
                    }
                    series.push(seriesObj)
                    data = []
                }
                dt = dayjs(`${exp.trxYear.toString()}-${numeral(exp.trxMonth).format('00')}-01`, 'YYYY-MM-DD').valueOf()
                data.push([dt, Number(exp.totalAmount.toFixed(2))])

                prevCatId = exp.categoryId
                prevCatName = exp.categoryName || 'Unknown'
            })
            if (expenses.length) {
                seriesObj = {
                    name: prevCatName,
                    data: data
                }
                series.push(seriesObj)
            }
            return series
        }).catch((error) => {
            console.error('ExpenseService.getExpenseTimeSeries error:', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Import expenses uploaded from a csv file
     * @param {array} expenses - array of expense objects
     * @param {object} importDetails - details of the import
     */
    importExpenses(expenses : ImportExpense[], importDetails : ImportDetails) {
        const importId : Date = new Date()

        // Normalize the trxDate to 'YYYY-MM-DD' and remove $ from amount
        expenses.forEach((exp : ImportExpense) => {
            exp.importId = importId
            exp.trxDate = dayjs(exp.trxDate, importDetails.dateFormat).format('YYYY-MM-DD')

            if (typeof exp.amount === 'string' && exp.amount.substr(0, 1) === '$') {
                exp.amount = exp.amount.substr(1)
            }
        })

        return axios.post(`${this.expenseUrl}import`, {
            expenses,
            importDetails
        }).then(() => {

        }).catch(error => {
            console.error('Error importing expenses:', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Delete expenses by import id
     * @param {string} importId - import id
     */
    deleteExpensesByImportId(importId : string) {
        return axios({
            url: `${this.expenseUrl}import/${importId}`,
            method: 'DELETE'
        }).then((response) => response.data).catch((error) => {
            console.error('ExpenseService.deleteExpensesByImportId error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    }
}
