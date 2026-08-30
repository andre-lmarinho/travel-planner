import { HomeView } from "@/modules/marketing/home-view";

export default function MarketingHomePage() {
  return (
    <HomeView
      keyBenefits={{
        title: "Plan together. See the route. Track the budget.",
        description:
          "Build a day-by-day itinerary, see every stop on the map, and keep the shared budget clear while you plan with your companions.",
        benefits: [
          {
            title: "Visual itinerary",
            description: "Arrange activities by day and move them as plans change.",
          },
          {
            title: "Interactive map",
            description: "See each stop in context and understand the route at a glance.",
          },
          {
            title: "Shared budget",
            description: "Set a total, record expenses by category, and see what remains.",
          },
        ],
      }}
    />
  );
}
