import { renderOrderSummary } from './checkout/ordersummary.js';
import { cart } from '../data/cart.js';
import { renderPaymatsummery } from './checkout/paymatsummery.js';
//import '../data/cart-class.js';
//import {xhr} from '../data/backend.js'; just for a teastd
import {loadProducts, loadProductsfetch} from '../data/products.js';
import { loadCart } from '../data/cart.js';

async function loadPage() {
   try{
    //throw 'error1';
await  loadProductsfetch();

const value = await new Promise((resolve, reject) => {
loadCart(
()  => {
   // reject('error loading cart');
    resolve('value3');
}
)
    })
   }
   
   catch(error){
    console.log('error loading cart');
   }




     renderOrderSummary();
    renderPaymatsummery();
 
    
}

loadPage();
/*
Promise.all([
  loadProductsfetch()
  ,new Promise((resolve) => {
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
*/
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
/*/*
async function loadPage() {
    console.log('loadPage');   
}
the above cose is the short cut of this =>s
function loadPage() {}
return new Promise((resolve) => {
    console.log('loadPage');   
    resolve();
}  )
*/
loadProducts(() => {
    loadCart(() => {
renderOrderSummary();
renderPaymatsummery();
    })

});
