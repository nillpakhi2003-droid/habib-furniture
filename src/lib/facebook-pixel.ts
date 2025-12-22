// Facebook Pixel helper functions
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const pageview = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
};

export const event = (name: string, options: Record<string, any> = {}) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", name, options);
  }
};

// Standard Events
export const viewContent = (data: {
  content_name: string;
  content_ids: string[];
  content_type: string;
  value: number;
  currency: string;
}) => {
  event("ViewContent", data);
};

export const addToCart = (data: {
  content_name: string;
  content_ids: string[];
  content_type: string;
  value: number;
  currency: string;
}) => {
  event("AddToCart", data);
};

export const initiateCheckout = (data: {
  content_name: string;
  content_ids: string[];
  value: number;
  currency: string;
  num_items: number;
}) => {
  event("InitiateCheckout", data);
};

export const purchase = (data: {
  value: number;
  currency: string;
  content_type: string;
  content_ids: string[];
}) => {
  event("Purchase", data);
};

export const lead = (data: {
  content_name: string;
  value: number;
  currency: string;
}) => {
  event("Lead", data);
};
