<template>
    <div class="page">
        <page-header title="Expense Summary"/>

        <div class="page-content table-content">
            <!-- Filter -->
            <table-filter>
                <template v-slot:inputs>
                    <!-- Start and end dates -->
                    <date-range-input :date-range="filter" @date-range-changed="filterChanged"/>
                    <!-- Category -->
                    <category-select v-model="filter.categoryIds" :items="selectCategories" label="Category"
                                     @change="filterChanged"/>
                </template>
            </table-filter>

            <!-- Data Table -->
            <div class="table-container">
                <v-data-table :headers="headers" :items="expenseTotals" item-key="categoryName" :sort-by.sync="sortBy"
                              :sort-desc.sync="sortDesc" :expanded.sync="expanded" :single-expand="singleExpand"
                              disable-pagination hide-default-footer show-expand must-sort @click:row="rowClicked">
                    <template v-slot:item.categoryName="{ item }">
                        <span v-if="!item.categoryName">Unknown</span>
                        <span v-if="item.categoryName">{{item.categoryName}}</span>
                    </template>
                    <template v-slot:item.totalAmount="{ item }">
                        <span>{{item.totalAmount | formatAmount}}</span>
                    </template>
                    <template v-slot:item.percent="{ item }">
                        <span>{{item.percent| formatAmount}}</span>
                    </template>
                    <template v-slot:no-data>
                        <div>No Data</div>
                    </template>
                    <template v-slot:expanded-item="{ headers, item }">
                        <td colspan="4" class="expanded-area">
                            <table class="subcategory-table">
                                <tbody>
                                <tr v-for="(subcat, idx) in item.subcategoryTotals" :key="idx">
                                    <td></td>
                                    <td>{{subcat.subcategoryName || 'Unknown'}}</td>
                                    <td class="subcategory-amount text-right">{{subcat.totalAmount | formatAmount}}</td>
                                </tr>
                                </tbody>
                            </table>
                            <div v-if="!item.subcategoryTotals.length" class="no-subcategories">
                                No Subcategory Data
                            </div>
                        </td>
                    </template>
                </v-data-table>
            </div>
            <div class="table-footer" style="position: relative;">
                <v-toolbar flat dense>
                    <span>{{expenseTotals.length}} {{rowText}}</span>
                    <v-spacer/>
                    <span>Total Amount: {{totalExpensesAmount | formatAmount}}</span>
                </v-toolbar>
            </div>
        </div>

        <!-- Snack Msg -->
        <snack-msg ref="snack" :options="snackOptions"/>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import ExpenseService from '@/services/expense'
    import CategoryService from '@/services/category'
    import SnackMsg from '@/components/common/SnackMsg.vue'
    import TableFilter from '@/components/common/TableFilter.vue'
    import DateRangeInput from '@/components/common/DateRangeInput.vue'
    import dayjs from 'dayjs'
    import PageHeader from '../common/PageHeader.vue'
    import CategorySelect from '../common/CategorySelect.vue'
    import { SnackOptions, CategorySelectItem, ExpenseSummary, ExpenseFilter } from '@/types/index'

    export default Vue.extend({
        name: 'ExpenseSummary',

        data() {
            return {
                singleExpand: true as boolean,
                expanded: [] as ExpenseSummary[],
                expenseTotals: [] as ExpenseSummary[],
                totalExpensesAmount: null as number | null,
                selectedExpense: {} as ExpenseSummary,
                sortBy: 'categoryName',
                sortDesc: false,
                expenses: [],
                categories: [],
                selectCategories: [] as CategorySelectItem[],
                filter: {
                    startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
                    endDate: dayjs().format('YYYY-MM-DD'),
                    categoryIds: [] as string[]
                } as ExpenseFilter,
                headers: [
                    { value: 'categoryName', text: 'Category' },
                    { value: 'percent', text: 'Percent', align: 'end' },
                    { value: 'totalAmount', text: 'Amount', align: 'end' },
                    { value: 'data-table-expand', text: '' }
                ],
                snackOptions: {
                    show: false,
                    msg: '',
                    color: 'error'
                } as SnackOptions
            }
        },

        components: {
            PageHeader,
            SnackMsg,
            TableFilter,
            DateRangeInput,
            CategorySelect
        },

        computed: {
            rowText() : string {
                return this.expenseTotals.length !== 1 ? 'rows' : 'row'
            }
        },

        methods: {
            /*
             * Retrieve the summarized expense data from the db
             */
            getExpenseTotals() : void {
                ExpenseService.getExpenseTotals(this.filter).then((expenseTotals) => {
                    this.expenseTotals = expenseTotals

                    // Collapse any expanded row
                    this.expanded.shift()

                    this.totalExpensesAmount = expenseTotals.reduce((sum, cat) => sum + Number(cat.totalAmount), 0)
                }).catch((error) => {
                    console.error('Error retrieving expense totals:', error)
                    this.snackOptions.msg = 'Error retrieving expense summary data'
                    this.snackOptions.show = true                   
                })
            },

            /*
             * Get the categories for the select drop down
             */
            getCategorySelect() : void {
                CategoryService.getCategorySelect().then((selectCategories) => {
                    this.selectCategories = selectCategories
                }).catch((error) => {
                    console.error('Error retrieving category select:', error)
                    this.snackOptions.msg = 'Error retrieving category select data'
                    this.snackOptions.show = true                  
                    return Promise.reject(error)
                })
            },

            /*
             * When the filter changes, retrieve the categories and expense data again
             */
            filterChanged() : void {
                this.getCategorySelect()
                this.getExpenseTotals()
            },

            /*
             * Handle manually expanding/collapsing rows on row click (vs expand icon click)
             */
            rowClicked(item : ExpenseSummary) : void {
                if (this.expanded.length && this.expanded[0] === item) {
                    this.expanded.shift()
                } else {
                    this.expanded.shift()
                    this.expanded.push(item)
                }
            }
        },

        /*
         * On mount, initialize the filter values and retrieve the categories and expense data
         */
        mounted() {
            this.getCategorySelect()
            this.getExpenseTotals()
        }
    })
</script>

<style lang="scss" scoped>
    @import '../../styles/global.scss';

    .filter-select {
        width: 200px;
    }
    .filter-input.select-input {
        width: 300px !important;
    }
    .no-subcategories {
        padding-left: 24px;
        background-color: #e9e8f4;
    }
    .expanded-area {
        background-color: #e9e8f4;
        .subcategory-table {
            td {
                background-color: #e9e8f4;
            }
            .subcategory-amount {
                padding-right: 58px;
            }
        }
    }
</style>
