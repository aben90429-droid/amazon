import { formatcurrency, formatPriceWithCurrency } from '../scripts/uitils/money.js';
import { setProductCatalog } from './cart.js';
import { notifyError } from './backend.js';
import { backendUrl } from './backend.js';

export function getproduct(productId) {
  let matchingproduct;
  products.forEach((product) => {
    if (product.id === productId) {
      matchingproduct = product;
    }
  });
  return matchingproduct;
}

export class product {
  id;
  image;
  name;
  rating;
  priceCents;
  stock;
  keywords;
  category;
  type;

  constructor(producDetalis) {
    this.id = producDetalis.id;
    this.image = producDetalis.image;
    this.name = producDetalis.name;
    this.rating = producDetalis.rating;
    this.priceCents = producDetalis.priceCents;
    this.stock = producDetalis.stock !== undefined ? producDetalis.stock : 12;
    this.keywords = producDetalis.keywords || [];
    this.category = producDetalis.category || '';
    this.type = producDetalis.type || 'clothing';
  }

  getstarsUrl() {
    return `images/ratings/rating-${Math.round(this.rating.stars * 10)}.png`;
  }

  getprice() {
    return formatPriceWithCurrency(this.priceCents);
  }

  extrainfoHtML() {
    return '';
  }
}

export class clossing extends product {
  sizeChartLink;

  constructor(productDetails) {
    super(productDetails);
    this.sizeChartLink = productDetails.sizeChartLink;
  }

  extrainfoHtML() {
    return `<a href="${this.sizeChartLink}" class="size-chart" target="_blank" rel="noreferrer">Size Chart</a>`;
  }
}

export const defaultCulturalProducts = [
  {
    "id": "e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
    "image": "images/products/habesha-kemis-white-ruffled.jpg",
    "name": "White Ruffled Habesha Kemis",
    "rating": {
      "stars": 5,
      "count": 312
    },
    "priceCents": 8500,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "white",
      "ruffled",
      "traditional"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "15b6fc6f-327a-4ec4-896f-486349e85a3d",
    "image": "images/products/habesha-kemis-green-cross-embroidery.jpg",
    "name": "Green Cross Embroidered Habesha Kemis",
    "rating": {
      "stars": 4.5,
      "count": 245
    },
    "priceCents": 12500,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "green",
      "embroidery",
      "cross",
      "traditional"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "83d4ca15-0f35-48f5-b7a3-1ea210004f2e",
    "image": "images/products/habesha-kemis-gold-tilf-pattern.jpg",
    "name": "Gold Tilf Pattern Habesha Kemis",
    "rating": {
      "stars": 5,
      "count": 189
    },
    "priceCents": 14000,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "gold",
      "tilf",
      "traditional",
      "handwoven"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "54e0eccd-8f36-462b-b68a-8182611d9add",
    "image": "images/products/habesha-kemis-colorful-cross-necklace.jpg",
    "name": "Colorful Embroidered Kemis with Cross Necklace",
    "rating": {
      "stars": 4.5,
      "count": 478
    },
    "priceCents": 9500,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "colorful",
      "cross",
      "embroidered",
      "accessories"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "3ebe75dc-64d2-4137-8860-1f5a963e534b",
    "image": "images/products/habesha-kemis-yellow-embroidered.jpg",
    "name": "Yellow Embroidered Habesha Kemis",
    "rating": {
      "stars": 5,
      "count": 356
    },
    "priceCents": 11000,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "yellow",
      "embroidered",
      "celebration"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "8c9c52b5-5a19-4bcb-a5d1-158a74287c53",
    "image": "images/products/habesha-kemis-teal-netela.jpg",
    "name": "Teal Netela & Kemis Set",
    "rating": {
      "stars": 4.5,
      "count": 203
    },
    "priceCents": 9800,
    "keywords": [
      "kemis",
      "netela",
      "habesha",
      "women",
      "teal",
      "set",
      "traditional",
      "accessories",
      "gabi"
    ],
    "category": "accessories",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "dd82ca78-a18b-4e2a-9250-31e67412f98d",
    "image": "images/products/habesha-kemis-lime-yellow-border.jpg",
    "name": "Lime & Yellow Border Habesha Kemis",
    "rating": {
      "stars": 4.5,
      "count": 167
    },
    "priceCents": 10500,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "lime",
      "yellow",
      "border",
      "handwoven"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "77919bbe-0e56-475b-adde-4f24dfed3a04",
    "image": "images/products/habesha-kemis-blue-v-neck.jpg",
    "name": "Blue V-Neck Habesha Kemis",
    "rating": {
      "stars": 5,
      "count": 291
    },
    "priceCents": 8900,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "blue",
      "v-neck",
      "elegant"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "3fdfe8d6-9a15-4979-b459-585b0d0545b9",
    "image": "images/products/habesha-kemis-pink-embroidered.jpg",
    "name": "Pink Embroidered Habesha Kemis",
    "rating": {
      "stars": 4.5,
      "count": 415
    },
    "priceCents": 7800,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "pink",
      "embroidered",
      "casual"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "58b4fc92-e98c-42aa-8c55-b6b79996769a",
    "image": "images/products/habesha-kemis-red-orange-short.jpg",
    "name": "Red & Orange Short Habesha Dress",
    "rating": {
      "stars": 4,
      "count": 134
    },
    "priceCents": 6500,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "kids",
      "family",
      "red",
      "orange",
      "short",
      "casual"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "5968897c-4d27-4872-89f6-5bcb052746d7",
    "image": "images/products/habesha-kemis-cream-hand-embroidered.jpg",
    "name": "Cream Hand-Embroidered Habesha Kemis",
    "rating": {
      "stars": 5,
      "count": 523
    },
    "priceCents": 15000,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "cream",
      "hand-embroidered",
      "luxury",
      "traditional"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "aad29d11-ea98-41ee-9285-b916638cac4a",
    "image": "images/products/habesha-couple-red-white-matching.jpg",
    "name": "Matching Couple Habesha Set - Red & White",
    "rating": {
      "stars": 5,
      "count": 687
    },
    "priceCents": 22000,
    "keywords": [
      "kemis",
      "habesha",
      "men",
      "women",
      "couple",
      "matching",
      "red",
      "white",
      "wedding",
      "melse",
      "kidan"
    ],
    "category": "weddings",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "04701903-bc79-49c6-bc11-1af7e3651358",
    "image": "images/products/habesha-kemis-red-woven-belted.jpg",
    "name": "Red Woven Belted Habesha Dress",
    "rating": {
      "stars": 4.5,
      "count": 198
    },
    "priceCents": 7200,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "red",
      "woven",
      "belted",
      "casual"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "901eb2ca-386d-432e-82f0-6fb1ee7bf969",
    "image": "images/products/habesha-kemis-green-celebration.jpg",
    "name": "Green Celebration Habesha Kemis",
    "rating": {
      "stars": 4.5,
      "count": 276
    },
    "priceCents": 8200,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "green",
      "celebration",
      "party"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "82bb68d7-ebc9-476a-989c-c78a40ee5cd9",
    "image": "images/products/habesha-kemis-green-closeup.jpg",
    "name": "Green Embroidered Habesha Top & Skirt",
    "rating": {
      "stars": 4.5,
      "count": 145
    },
    "priceCents": 7500,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "green",
      "embroidered",
      "top",
      "skirt"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "c2a82c5e-aff4-435f-9975-517cfaba2ece",
    "image": "images/products/habesha-kemis-green-teal-balloons.jpg",
    "name": "Green & Teal Habesha Kemis - Occasion Wear",
    "rating": {
      "stars": 5,
      "count": 342
    },
    "priceCents": 9900,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "kids",
      "family",
      "green",
      "teal",
      "occasion",
      "graduation"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "6b07d4e7-f540-454e-8a1e-363f25dbae7d",
    "image": "images/products/habesha-kemis-white-gold-hem.jpg",
    "name": "White & Gold Hem Habesha Kemis",
    "rating": {
      "stars": 5,
      "count": 401
    },
    "priceCents": 11500,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "white",
      "gold",
      "hem",
      "elegant",
      "modern"
    ],
    "category": "women",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "a82c6bac-3067-4e68-a5ba-d827ac0be010",
    "image": "images/products/habesha-kemis-white-blue-green-beaded.jpg",
    "name": "White Beaded Habesha Kemis - Blue & Green",
    "rating": {
      "stars": 5,
      "count": 558
    },
    "priceCents": 18000,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "white",
      "beaded",
      "blue",
      "green",
      "luxury",
      "wedding",
      "melse"
    ],
    "category": "weddings",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  },
  {
    "id": "e4f64a65-1377-42bc-89a5-e572d19252e2",
    "image": "images/products/habesha-kemis-off-shoulder-glamour.jpg",
    "name": "Off-Shoulder Glamour Habesha Kemis",
    "rating": {
      "stars": 5,
      "count": 623
    },
    "priceCents": 16500,
    "keywords": [
      "kemis",
      "habesha",
      "women",
      "off-shoulder",
      "glamour",
      "luxury",
      "wedding",
      "melse"
    ],
    "category": "weddings",
    "type": "clothing",
    "sizeChartLink": "images/clothing-size-chart.png",
    "stock": 12
  }
];

export let products = defaultCulturalProducts.map((details) => {
  if (details.type === 'clothing') {
    return new clossing(details);
  }
  return new product(details);
});
setProductCatalog(products);

export function loadProductsfetch() {
  const promise = fetch(`${backendUrl}/products`).then((response) => {
    return response.json();
  }).then((productsData) => {
    if (Array.isArray(productsData) && productsData.length > 0) {
      products = productsData.map((productDetails) => {
        if (productDetails.type === 'clothing') {
          return new clossing(productDetails);
        }
        return new product(productDetails);
      });
      setProductCatalog(products);
      console.log('Products loaded from backend');
    }
  }).catch((error) => {
    console.warn('Backend fetch failed, using fallback cultural products:', error);
  });
  return promise;
}

export function loadProducts(fun) {
  const xhr = new XMLHttpRequest();
  xhr.addEventListener('load', () => {
    try {
      const productsData = JSON.parse(xhr.response);
      if (Array.isArray(productsData) && productsData.length > 0) {
        products = productsData.map((productDetails) => {
          if (productDetails.type === 'clothing') {
            return new clossing(productDetails);
          }
          return new product(productDetails);
        });
        setProductCatalog(products);
      }
    } catch (e) {
      console.warn('XHR parse failed, using fallback products');
    }
    if (typeof fun === 'function') fun();
  });
  xhr.addEventListener('error', (error) => {
    console.warn('Backend XHR failed, using fallback cultural products');
    if (typeof fun === 'function') fun();
  });
  xhr.open('GET', `${backendUrl}/products`);
  xhr.send();
}
