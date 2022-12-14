import { ActionProps, CartItemProps, CartProps, ProductProps } from '../types'
import { BigNumber } from 'ethers'
import { initialCartState } from '../state/constants'
import env from '../config'

const cartReducer = (state: CartProps = initialCartState, action: ActionProps): CartProps => {
    const type = action.type
    const payload: any = action.payload

    let calculateTotalPrice = (items: CartItemProps[]): BigNumber => {
        let total: BigNumber = BigNumber.from('0')
        items.forEach((item: CartItemProps)=>{
            total = total.add(item.product?.price.mul(item.quantity))
        })
        return total
    }
    let min = (items: number[]): number => {
        let min: number = 0

        if(items.length === 0)
            return min
        
        min = items[0]
        let length: number = items.length
        for(let i = 0; i < length; i++ ){
            min = min > items[i] ? items[i] : min
        }

        return min;
    }

    switch (type) {
        case 'ADD_PRODUCT':

            let callback: any = payload.callback
            let product: ProductProps = payload.item.product
            let id: BigNumber = product.id
            let addQuantity: number = payload.item.quantity
            addQuantity = min([addQuantity, product.qty, env.MAX_QTY])
            let price: BigNumber = BigNumber.from('0')
            let _newItems: CartItemProps[] = []
            let newTotal: BigNumber = BigNumber.from('0')
            let exist: boolean = false
            let lastItem: CartItemProps = {product: null, quantity: 0}

            let addItem = () => {
                
                state.items.forEach((item: CartItemProps) => {
                    let _quantity: number = 0
                    let _product: ProductProps = item.product
                    if(item.product.id.eq(id)) {
                        exist = true
                        _quantity = addQuantity + item.quantity
                        _quantity = min([_quantity, item.product.qty, env.MAX_QTY])
                        _product = product
                        lastItem = { product: product, quantity: _quantity - item.quantity}
                    } else {
                        _quantity = item.quantity
                    }
                    _newItems.push({product: _product, quantity: _quantity})
                })
                if(!exist) {
                    price = product.price.mul(BigNumber.from(addQuantity))
                    newTotal = newTotal.add(price)
                    lastItem = {product: product, quantity: addQuantity}
                    _newItems.push(lastItem)
                }
            }
            addItem()
            if(lastItem.quantity > 0) callback(lastItem, _newItems.length)
            let _total: BigNumber = calculateTotalPrice(_newItems)
            return {
                ...state,
                total: _total,
                items: _newItems,
                ids: exist ? state.ids : [...state.ids, id],
            }
        case 'INCREASE_QUANTITY':
            return {
                ...state,
                items: state.items.map((item: CartItemProps) => {

                    if(item.product.id.eq(payload)) {
                        return { product: item.product, quantity: item.quantity + 1}
                    }
                    return item
                })
            }
        
        case 'DECREASE_QUANTITY':
            // let newtotal: BigNumber = state.total
            let __newItems: CartItemProps[] = []
            let _newIds: number[] = []
            let decreasedAmount: BigNumber = BigNumber.from('0')
            state.items.forEach((item: CartItemProps) => {
                if(item.product.id.eq(payload)) {

                    let quantity: number = 0
                    if(item.quantity > 1) {
                        quantity = item.quantity - 1
                        decreasedAmount = item.product.price
                    } else if ( item.quantity === 1) {
                        quantity = 1
                    }
                    __newItems.push({product: item.product, quantity: quantity})
                    
                    return
                } else {
                    __newItems.push(item)
                }
                 _newIds.push(item.product.id.toNumber())
            })
            return {
                ...state,
                total: state.total.sub(decreasedAmount),
                items: __newItems,
                ids: _newIds,
            }
        case 'REMOVE_PRODUCT':
            return state
        case 'SET_PENDING_ITEM':
            // let pendignItems: CartItemProps = payload
            console.log('set pending item', payload)
            return {
                ...state,
                pendingItem: payload,
            }
        case 'REMOVE_PENDING_ITEM':
            // let items: CartItemProps[] = payload
            console.log('remove pending item', state.pendingItem)
            let ___newItems: CartItemProps[] = []
            
            state.items.forEach((item: CartItemProps) => {
                let quantity: number = item.quantity
                let id: BigNumber = item.product.id
                
                if(id.eq(state.pendingItem.product.id)) {
                    quantity = item.quantity - state.pendingItem.quantity
                }
                if(quantity > 0) {
                    ___newItems.push({product: item.product, quantity: quantity})
                }
            })
            let __total: BigNumber = calculateTotalPrice(___newItems)
            return {
                ...state,
                items: ___newItems,
                total: __total,
                pendingItem: {product: null, quantity: 0}
            }
        case 'CLEAR_PENDING_ITEM':
            return {
                ...state,
                pendingItem: {product: null, quantity: 0}
            }
        case 'SET_PAGE':
            let newState = {...state, currentPage: payload}
            return newState
        case 'DELETE_PRODUCT':
            let total: BigNumber = state.total;
            let productId: BigNumber = payload
            
            let newIds = state.ids.filter((id: any) => {
                if(id === productId.toNumber()) {
                    return false
                }
                return true
            })
            let newItems = state.items.filter((item: CartItemProps, key: number) => {
                if(item.product.id.eq(payload)) {
                    total =  total.sub(item.product?.price.mul((item.quantity)))
                    return false
                }
                return true
            })
            return { ...state, items: newItems, total: total, ids: newIds }
        case 'SET_DISCOUNT_AMOUNT':
            return {
                ...state,
                discount: payload
            }
        case 'SET_CYBER_ID':
            let __newState = {
                ...state,
                cyberProductId: payload
            }
            return __newState
        case 'SET_HOODIE_STYLE':
            console.log('set hoodie style to ',payload)
            return {
                ...state,
                hoodieStyle: payload,
            }
        case 'REMOVE_ALL':
            return initialCartState
        default:
            return state
    }
}

export { cartReducer }