import fetch from "node-fetch";

const API_URL = "https://api.schoolnutritionandfitness.com/graphql";

async function fetchMenu() {
  const query = `
    query GetMenu($id: String!) {
      menu(id: $id) {
        id
        month
        year
        items {
          day
          product {
            id
            name
            meal
            food_group
          }
          nutrients {
            calories
            total_fat
            protein
            carbs
          }
        }
      }
    }
  `;

  const variables = {
    id: "686d30fabb4fd66b4830acfa" 
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error("GraphQL Errors:", result.errors);
    throw new Error("GraphQL query failed");
  }

  const menu = result.data.menu;

  return menu.items;
}

// Run test
(async () => {
  try {
    const data = await fetchMenu();
    console.log("Days of Menu:");
    data.forEach(item => {
      item.product?.name && console.log(`Day ${item.day}: ${item.product.name}`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
})();

