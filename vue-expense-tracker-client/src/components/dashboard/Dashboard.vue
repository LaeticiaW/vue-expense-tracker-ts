<template>
    <div class="dashboard-container">
        <page-header title="Dashboard"/>

        <grid-layout v-bind="dashboardOptions" :layout="dashboardLayout" :class="{hidelayout: hideLayout}"
                     @layout-updated="layoutUpdated" @updated="layoutUpdated">
            <grid-item v-for="item in dashboardLayout" v-bind="item" :key="item.i" :id="item.i">
                <component :is="item.component" :options="item" @maximize="maximize(item)" @minimize="minimize(item)"/>
            </grid-item>
        </grid-layout>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue'
    import VueGridLayout from 'vue-grid-layout'
    import CategoryExpensesChart from '@/components/dashboard/dashlets/CategoryExpensesChart.vue'
    import ExpensesOverTimeChart from '@/components/dashboard/dashlets/ExpensesOverTimeChart.vue'
    import PageHeader from '../common/PageHeader.vue'
    import Util from '@/services/util'
    import { DashletOptions } from '@/types/index'

    const defaultSize = {
        w: 6, h: 4, minH: 3, minW: 4
    }

    export default Vue.extend({
        name: 'Dashboard',
        provide() {
            return {
                // Event bus used for dashlet to dashboard communication
                dashboardEventBus: null
            }
        },
        data() {
            return {
                dashboardOptions: {
                    colNum: 12,
                    rowHeight: 80,
                    isDraggable: true,
                    isResizable: true,
                    isMirrored: false,
                    verticalCompact: true,
                    margin: [24, 24, 24, 24],
                    useCssTransforms: false,
                    autoSize: true
                },
                dashboardLayout: [
                    {
                        x: 0, y: 0, i: '0', ...defaultSize, component: 'category-expenses-chart', dashletTitle: 'Expenses By Category'
                    },
                    {
                        x: 6, y: 0, i: '1', ...defaultSize, component: 'expenses-over-time-chart', dashletTitle: 'Expenses Over Time'
                    }
                ],
                hideLayout: false
            }
        },

        components: {
            PageHeader,
            GridLayout: VueGridLayout.GridLayout,
            GridItem: VueGridLayout.GridItem,
            CategoryExpensesChart,
            ExpensesOverTimeChart
        },

        methods: {
            /*
             * When the layout is updated, trigger a window resize event so that the charts will display correctly
             */
            layoutUpdated() : void {
                this.triggerWindowResize()
            },

            /*
             * Maximize the specified dashlet - make it full screen size
             */
            maximizeDashlet(dashletOptions : DashletOptions) : void {
                this.hideLayout = true
                // Set the'hide' class on all vue grid items except for the one that is maximized
                const elList : HTMLElement[] = Array.from(this.$el.querySelectorAll('.vue-grid-item'))
                elList.forEach((el : HTMLElement) => {
                    el.classList.add('hide')
                })
                this.$el.querySelector(`.vue-grid-item[id="${dashletOptions.i}"]`)?.classList.remove('hide')
                this.$el.querySelector(`.vue-grid-item[id="${dashletOptions.i}"]`)?.classList.add('maximize')
                this.triggerWindowResize()
            },

            /*
             * Minimize the dashlets
             */
            minimizeDashlet() : void {
                this.hideLayout = false
                const elList : HTMLElement[] = Array.from(this.$el.querySelectorAll('.vue-grid-item'))
                elList.forEach((el : HTMLElement) => {
                    el.classList.remove('hide')
                    el.classList.remove('maximize')
                })
                this.triggerWindowResize()
            },

            /*
             * Trigger a window resize event.  This is used to fix chart rendering issues.
             */
            triggerWindowResize() : void {                
                this.$nextTick(() => {                  
                    // For Chrome, Firefox, and IE > 11
                    window.dispatchEvent(new Event('resize'))                   
                })
            }
        },

        /*
         * On create, intialize the dashboard event bus to listen for minimize and maximize events from the dashlets
         */
        created() {
            // @ts-ignore
            this._provided.dashboardEventBus = new Vue()   
            // @ts-ignore       
            this.dashboardEventBus = this._provided.dashboardEventBus  

            this.dashboardEventBus.$on('maximize', this.maximizeDashlet)           
            this.dashboardEventBus.$on('minimize', this.minimizeDashlet)
        },

        /*
         * On mount, trigger a window resize event so that the charts display correctly
         */
        mounted() : void {
            setTimeout(() => {
                this.triggerWindowResize()
            }, 0)
        },

        /*
         * Before destroy, remove the dashboard event bus event listeners
         */
        beforeDestroy() : void {         
            this.dashboardEventBus.$off('maximize', this.maximizeDashlet)           
            this.dashboardEventBus.$off('minimize', this.minimizeDashlet)
        }
    })
</script>

<style lang="scss" scoped>
    @import '../../styles/global.scss';

    .vue-grid-item.hide {
        display: none !important;
    }

    .vue-grid-item.maximize {
        top: 24px !important;
        left: 24px !important;
        width: 96% !important;
        height: calc(100vh - 180px) !important;
    }

</style>
