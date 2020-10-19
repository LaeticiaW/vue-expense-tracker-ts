import Vue from 'vue'

export interface FormCategory {
    name: string
    subcategories: Subcategory[]   
}

export interface Category extends FormCategory {
    _id: string
    treeId?: number
    parentTreeId?: number    
}

export interface CategorySelectItem {
    _id: string | undefined
    name: string
}

export interface Subcategory {
    id: string
    treeId?: number
    parentTreeId?: number
    name: string
    matchText: string[]    
}

export interface CategoryMap {
    [categoryId: string] : Category
} 

export interface SubcategoryMap {
    [subcategoryId: string] : Subcategory
} 

export type CategoryOrSubcategory = Category | Subcategory

export type CategoryOrSubcategoryArray = CategoryOrSubcategory[]
