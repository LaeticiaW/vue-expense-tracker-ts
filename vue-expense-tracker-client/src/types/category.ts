import Vue from 'vue'

export interface Category {
    _id: string
    name: string
    subcategories: Subcategory[]   
    treeId?: number
    parentTreeId?: number
}

export type NewCategory = Omit<Category, "_id" | "treeId" | "parentTreeId">

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
