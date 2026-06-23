export const deliveryoptions = [{
  id: '1',
  deliveryDate: 7,
  pricecents: 0,
}, {
  id: '2',
  deliveryDate: 3,
  pricecents: 499,
}, {
  id: '3',
  deliveryDate: 1,
  pricecents: 999,
}];

export function getdeliveryoption(id) {
  let deliveryOption;

  deliveryoptions.forEach((option) => {
    if (option.id === id) {
      deliveryOption = option;
    }
  });
  return deliveryOption || deliveryoptions[0];
}