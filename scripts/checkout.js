import { renderOrderSummary } from './checkout/ordersummary.js';
import { cart } from '../data/cart.js';
import { renderPaymatsummery } from './checkout/paymatsummery.js';
//import '../data/cart-class.js';
//import {xhr} from '../data/backend.js'; just for a teastd
import {loadProducts} from '../data/products.js';
import { loadCart } from '../data/cart.js';
Promise.all([
    new Promise((resolve) =>{
   
    loadProducts(() => {
     
        resolve('value1');
    })
}),   new Promise((resolve) => {
loadCart(
() => {
    resolve();
}
)
    })
]).then((values) => {
    console.log(values);
    renderOrderSummary();
    renderPaymatsummery();
})

/*new Promise((resolve) =>{
   
    loadProducts(() => {
     
        resolve('value1');
    })

}).then((value) => {
    console.log(value); 
    return new Promise((resolve) => {
loadCart(
() => {
    resolve();
}
)
    })

}).then(() => {
    renderOrderSummary();
    renderPaymatsummery();
})*/
/*
loadProducts(() => {
    loadCart(() => {
renderOrderSummary();
renderPaymatsummery();
    })

});
*/