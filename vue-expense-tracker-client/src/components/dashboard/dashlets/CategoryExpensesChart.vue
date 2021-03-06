<template>
    <dashlet :options="options">
        <!-- Dashlet Actions -->
        <template v-slot:actions>
            <!-- Start and end dates -->
            <date-range-input :date-range="filter" @date-range-changed="filterChanged"/>
        </template>

        <!-- Dashlet Content -->
        <template v-slot:content>
            <div v-if="show" class="content-container">
                <div class="chart-container">
                    <highcharts v-if="show" ref="highcharts" :options="chartOptions"/>
                </div>
                <div class="chart-bottom-text">Total Expenses: ${{totalExpensesAmount | formatAmount}}</div>
            </div>

            <!-- Snack Message -->
            <snack-msg :options="snackOptions"/>
        </template>
    </dashlet>
</template>

<script lang="ts">
    import Vue from 'vue'
    import Dashlet from '@/components/dashboard/Dashlet.vue'
    import ExpenseService from '@/services/expense'
    import SnackMsg from '@/components/common/SnackMsg.vue'
    import DateRangeInput from '@/components/common/DateRangeInput.vue'
    import numeral from 'numeral'
    import dayjs from 'dayjs'
    import { SnackOptions, Category, SubcategoryTotal, Expense, ExpenseFilter, Series, ExpenseSummary } from '@/types/index'

    export default Vue.extend({
        name: 'CategoryExpensesChart',
        props: {
            // Options object contains vue-grid-item options plus component and dashletTitle properties
            options: {
                type: Object,
                required: true
            }
        },
        data() {
            return {
                show: true as boolean,
                chartOptions: {},
                categoryTotals: [] as ExpenseSummary[],
                totalExpensesAmount: null as number | null,
                filter: {
                    startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
                    endDate: dayjs().format('YYYY-MM-DD'),
                    categoryIds: []
                } as ExpenseFilter,
                snackOptions: {
                    show: false,
                    msg: '',
                    color: 'error'
                } as SnackOptions,
                series: [] as Series[],
                drillDownSeries: {}
            }
        },
        components: {
            Dashlet,
            SnackMsg,
            DateRangeInput
        },
        methods: {
            /*
             * Retrieve the expense amounts grouped by categories and subcategory for a year or month duration
             */
            getExpenseTotals() : void {
                ExpenseService.getExpenseTotals(this.filter).then((categoryTotals) => {
                    this.categoryTotals = categoryTotals
                    this.totalExpensesAmount = categoryTotals.reduce((sum, cat) => sum + Number(cat.totalAmount), 0)

                    this.series = this.formatSeriesData(this.categoryTotals)
                    this.drillDownSeries = this.formatDrillDownSeries(this.categoryTotals)
                    this.chartOptions = this.getChartOptions()
                    this.show = true
                }).catch((error) => {
                    console.error('Error retrieving expense totals:', error)
                    this.snackOptions.msg = 'Error retrieving data for Expenses by Category dashlet'
                    this.snackOptions.show = true
                })
            },

            /*
             * When filter values change, retrieve the expense data again
             */
            filterChanged() : void {
                this.getExpenseTotals()
            },

            /*
             * Format the expense data for a Highcharts time series chart
             */
            formatSeriesData(categoryTotals : ExpenseSummary[]) {
                const series = categoryTotals.map((item) => ({
                    name: item.categoryName || 'Unknown',
                    y: item.totalAmount,
                    drilldown: item.categoryName || 'Unknown'
                }))
                return series
            },

            /*
             * Format the expense data for the drilldown to subcategory level
             */
            formatDrillDownSeries(categoryTotals : ExpenseSummary[]) : Series[] {
                const series : Series[] = categoryTotals.map((item : ExpenseSummary) => {
                    return {
                        name: item.categoryName,
                        id: item.categoryName,
                        data: item.subcategoryTotals.map((subcat : SubcategoryTotal) => {
                            return [subcat.subcategoryName || 'Unknown', subcat.totalAmount]
                        })
                    }
                })
                return series
            },

            /*
             * Get the Highcharts options for the time series line chart
             */
            getChartOptions() {
                const chartOptions = {
                    chart: {
                        type: 'pie'
                    },
                    title: {
                        text: undefined
                    },
                    tooltip: {
                        headerFormat: '',
                        useHTML: true,
                        point: {name: '', y: 0, percentage: 0}, // hack for typescript
                        formatter() : string {
                            const amt = numeral(this.point.y).format('0,0.00')
                            const pct = ` (${numeral(this.point.percentage).format('00.0')}%)`
                            return `${this.point.name}: <b>$${amt}${pct}</b>`
                        }
                    },
                    plotOptions: {
                        series: {
                            states: {
                                inactive: {
                                    opacity: 1
                                }
                            }
                        },
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: false,
                                distance: 25
                            },
                            showInLegend: true,
                            series: {
                                states: {
                                    inactive: {
                                        opacity: 1
                                    }
                                }
                            }
                        }
                    },
                    legend: {
                        layout: 'vertical',
                        align: 'right',
                        verticalAlign: 'middle',
                        useHTML: true
                    },
                    series: [{
                        name: 'Categories',
                        data: this.series
                    }],
                    drilldown: {
                        drillUpButton: {
                            position: {
                                y: 0,
                                x: 32
                            }
                        },
                        series: this.drillDownSeries
                    }
                }
                return chartOptions
            }
        },

        /*
         * On create, initialize the filter and retrieve the categories and expense time series data
         */
        mounted() : void {
            this.getExpenseTotals()
        }
    })
</script>

<style lang="scss" scoped>
    .content-container {
        position: relative;
        height: 100%;

        .chart-container {
            position: relative;
            height: 100%;

            ::v-deep div[data-highcharts-chart] {
                position: relative;
                height: 100% !important;
                width: 100%;
            }
        }
    }

    .filter-input {
        width: 120px !important;
        margin-right: 12px;
    }

    .chart-bottom-text {
        position: absolute;
        bottom: -24px;
        right: 4px;
        z-index: 5;
        opacity: 1;
        background-color: #ffffff;
    }
</style>
