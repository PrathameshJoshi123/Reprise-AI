export const getCategoryCount = async (category: string) => {
  try {
    const res = await fetch(
      `https://dummyjson.com/products/category/${category}`
    );
    const data = await res.json();
    return data.total;
  } catch (error) {
    console.error("API Error:", error);
    return 0;
  }
};

export const getPopularDevices = async () => {
  try {
    const res = await fetch(
      "https://dummyjson.com/products/category/smartphones?limit=10"
    );
    const data = await res.json();
    return data.products;
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};
