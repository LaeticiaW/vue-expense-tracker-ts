import { mount } from '@vue/test-utils'
import ExpenseSummary from '@/components/expenses/ExpenseSummary'
import SpecUtil from '@/../tests/unit/specUtil'
import Vuetify from 'vuetify'
import moxios from 'moxios'
import flushPromises from 'flush-promises'
import moment from 'moment'

describe('ExpenseSummary.vue', () => {
    const localVue = SpecUtil.getLocalVueInstance()

    const categories = [
        {
            _id: '1',
            name: 'Auto',
            subcategories: [
                { id: '101', name: 'Auto Insurance', matchText: ['Progressive'] },
                { id: '102', name: 'Auto Service', matchText: ['Ford', 'Subaru'] },
                { id: '103', name: 'Gas', matchText: ['ExxonMobil', 'Valero'] }
            ]
        },
        {
            _id: '2',
            name: 'Groceries',
            subcategories: [
                { id: '104', name: 'Costco', matchText: ['Costco'] },
                { id: '105', name: 'Food Lion', matchText: ['Food Lion'] },
                { id: '106', name: 'Harris Teeter', matchText: ['Harris Teeter', 'HarrisTeeter'] }
            ]
        },
        {
            _id: '3',
            name: 'Utilities',
            subcategories: [
                { id: '107', name: 'Electric' },
                { id: '108', name: 'Gas', matchText: ['Valero'] },
                { id: '109', name: 'Internet', matchText: ['Spectrum'] }
            ]
        }
    ]

    const expenseTotals = [
        { _id: { categoryId: '1', subcategoryId: '10' }, categoryId: '1', subcategoryId: '10', totalAmount: 500.00, categoryName: 'Auto', subcategoryName: 'Auto Insurance' },
        { _id: { categoryId: '1', subcategoryId: '11' }, categoryId: '1', subcategoryId: '11', totalAmount: 35.50, categoryName: 'Auto', subcategoryName: 'Auto Service' },
        { _id: { categoryId: '1', subcategoryId: '5' }, categoryId: '1', subcategoryId: '5', totalAmount: 40.25, categoryName: 'Auto', subcategoryName: 'Gas' },
        { _id: { categoryId: '2', subcategoryId: '2' }, categoryId: '2', subcategoryId: '2', totalAmount: 29.00, categoryName: 'Groceries', subcategoryName: 'Harris Teeter' },
        { _id: { categoryId: '2', subcategoryId: '55' }, categoryId: '2', subcategoryId: '55', totalAmount: 51.00, categoryName: 'Groceries', subcategoryName: 'Whole Foods' },
        { _id: { categoryId: '2', subcategoryId: '56' }, categoryId: '2', subcategoryId: '56', totalAmount: 42.17, categoryName: 'Groceries', subcategoryName: 'Costco' },
        { _id: { categoryId: '3', subcategoryId: '57' }, categoryId: '3', subcategoryId: '57', totalAmount: 23.00, categoryName: 'Utilities', subcategoryName: 'Gas' },
        { _id: { categoryId: '3', subcategoryId: '58' }, categoryId: '3', subcategoryId: '58', totalAmount: 120.10, categoryName: 'Utilities', subcategoryName: 'Internet' }
    ]

    const mountComponent = function (propsData) {
        const vuetify = new Vuetify()
        return mount(ExpenseSummary, {
            sync: false,
            vuetify,
            localVue,
            propsData: propsData || {}
        })
    }

    beforeEach(() => {
        // Install moxios and stub the category and expense response data
        moxios.install()
        moxios.stubRequest(/category/, {
            status: 200,
            response: categories
        })
        moxios.stubRequest(/expense\/totals/, {
            status: 200,
            response: expenseTotals
        })
    })

    afterEach(() => {
        // Uninstall moxios
        moxios.uninstall()
    })

    test('Renders page title, filter, and data table', async () => {
        // Mount the Expenses component
        const wrapper = mountComponent()

        // Let the promises resolve
        await flushPromises()

        // Find dom elements
        const pageTitle = wrapper.find('.page-title').text()
        const filter = wrapper.find('.filter-container')
        const table = wrapper.find('.table-container')

        // Test values
        expect(pageTitle).toEqual('Expense Summary')
        expect(filter.exists()).toBe(true)
        expect(table.exists()).toBe(true)
    })

    test('Filter contains startDate, endDate, and category inputs', async () => {
        const wrapper = mountComponent()
        await flushPromises()

        const filter = wrapper.find('.filter-container')
        const filterStartDate = filter.find('[name="startDate"]').element.value
        const filterEndDate = filter.find('[name="endDate"]').element.value
        const filterCategory = filter.find('.category-select')

        // Get year to date start and end date values
        const start = moment().startOf('year').format('YYYY-MM-DD')
        const end = moment().format('YYYY-MM-DD')

        expect(filterStartDate).toEqual(start)
        expect(filterEndDate).toEqual(end)
        expect(filterCategory.exists()).toBe(true)
    })

    test('Table contains correct header fields', async () => {
        const wrapper = mountComponent()
        await flushPromises()

        const headers = wrapper.findAll('th span')

        expect(headers.length).toEqual(4)

        expect(headers.at(0).text()).toEqual('Category')
        expect(headers.at(1).text()).toEqual('Percent')
        expect(headers.at(2).text()).toEqual('Amount')
        expect(headers.at(3).text()).toEqual('') // data expand column
    })

    test('Table contains expense summary rows with correct values', async () => {
        const wrapper = mountComponent()
        await flushPromises()

        const rows = wrapper.findAll('tbody > tr')
        const row1 = rows.at(0).findAll('td')
        const row2 = rows.at(1).findAll('td')
        const row3 = rows.at(2).findAll('td')

        expect(rows.length).toEqual(3)

        expect(row1.at(0).text()).toEqual('Auto')
        expect(row1.at(1).text()).toEqual('68.46')
        expect(row1.at(2).text()).toEqual('575.75')

        expect(row2.at(0).text()).toEqual('Groceries')
        expect(row2.at(1).text()).toEqual('14.53')
        expect(row2.at(2).text()).toEqual('122.17')

        expect(row3.at(0).text()).toEqual('Utilities')
        expect(row3.at(1).text()).toEqual('17.02')
        expect(row3.at(2).text()).toEqual('143.10')
    })

    test('Table footer displays the number of rows', async () => {
        const wrapper = mountComponent()
        await flushPromises()

        const footer = wrapper.find('.table-footer span').text()

        expect(footer).toEqual('3 rows')
    })
})
