import axios, { AxiosResponse } from 'axios'
import _ from 'lodash-core'
import { Category, FormCategory, Subcategory, CategorySelectItem, CategoryMap, SubcategoryMap } from '@/types/index.js'

export default {
    categoryUrl: 'http://localhost:3000/category/',
    maxTreeId: 1,

    /*
     * Retrieve the list of all categories
     */
    getCategories() {
        return axios.get(this.categoryUrl).then((response: AxiosResponse) => {
            // Add tree id to data, only for UI use with Vuetify treeView widget and not persisted
            if (response.data && response.data.length) {
                response.data.forEach((category : Category) => {
                    category.treeId = this.maxTreeId++
                    category.subcategories.forEach((subcat) => {
                        subcat.treeId = this.maxTreeId++
                        subcat.parentTreeId = category.treeId
                    })
                })

                // Sort the categories by name
                response.data.sort((a : Category, b: Category) => {
                    if (a.name.toLowerCase() < b.name.toLowerCase()) {
                        return -1
                    }
                    if (a.name.toLowerCase() > b.name.toLowerCase()) {
                        return 1
                    }
                    return 0
                })

                return response.data
            }
            return []
        }).catch((error) => {
            console.error('CategoryService.getCategories error:', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Create a new categories
     * @param {object} categories - categories object to create
     */
    createCategory(category : FormCategory) {
        return axios({
            url: this.categoryUrl,
            method: 'POST',
            data: category
        }).then((response : AxiosResponse) => response.data).catch((error) => {
            console.error('CategoryService.createCategory error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Update an existing categories
     * @param {object} categories - categories object to update
     */
    updateCategory(category : Category) {
        // Make a copy of the category and remove the treeId and parentTreeId properties before updating.  These properties
        // are required for the tree widget, but are set at the client and do not need to be persisted.
        const cat = _.cloneDeep(category)
        delete cat.treeId
        delete cat.parentTreeId
        cat.subcategories.forEach((subcat : Subcategory) => {
            delete subcat.treeId
            delete subcat.parentTreeId
        })

        return axios({
            url: this.categoryUrl + category._id,
            method: 'PUT',
            data: cat
        }).then((response : AxiosResponse) => response.data).catch((error) => {
            console.error('CategoryService.updateCategory error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Delete a categories
     * @param {string} categoryId - id of categories to delete
     */
    deleteCategory(categoryId : string | null) {
        return axios({
            url: this.categoryUrl + categoryId,
            method: 'DELETE'
        }).then((response : AxiosResponse) => response.data).catch((error) => {
            console.error('CategoryService.deleteCategory error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Retrieve the categories data and process it, returning the categories list, subcategory list, categories map, and subcategory map
     */
    getCategoryInfo() {
        return this.getCategories().then((categories : Category[]) => {
            const selectCategories = categories.map((item) => ({
                _id: item._id,
                name: item.name
            }))

            const categoryMap : CategoryMap = categories.reduce((map : CategoryMap, obj : Category) => {               
                map[obj._id] = obj              
                return map
            }, {})

            const subcategories : Subcategory[] = [] 
            categories.forEach((cat : Category) => {
                if (cat.subcategories && cat.subcategories.length) {
                    subcategories.push(...cat.subcategories)
                }
            })
            const subcategoryMap = subcategories.reduce((map : SubcategoryMap, subcat : Subcategory) => {
                map[subcat.id] = subcat
                return map
            }, {})

            return {
                categories,
                selectCategories,
                categoryMap,
                subcategories,
                subcategoryMap
            }
        }).catch((error) => {
            console.error('CategoryService.getCategoryInfo error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Retrieve the categories data for a select drop down
     */
    getCategorySelect() : Promise<CategorySelectItem[]> {
        return this.getCategories().then((categories : Category[]) => {
            const selectCategories : CategorySelectItem[] = categories.map((item : Category) => ({
                _id: item._id,
                name: item.name
            }))

            return selectCategories
        }).catch((error) => {
            console.error('CategoryService.getCategorySelect error', error.response ? error.response : error)
            return Promise.reject(error.response)
        })
    },

    /*
     * Create the categoryMap from a list of categories.  The categoryMap key is the categoryId and the 
     * value is the category
     */
    getCategoryMap(categories: Category[]) : CategoryMap {
        const categoryMap : CategoryMap = categories.reduce((map : CategoryMap, obj : Category) => {               
            map[obj._id] = obj              
            return map
        }, {})
        return categoryMap
    }
}
