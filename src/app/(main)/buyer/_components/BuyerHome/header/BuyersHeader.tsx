"use client";
import React, { useState } from "react";
import { StarIcon, YellowStarIcon } from "@/icons/Icons";
import { useFollowing } from "@/hooks/followingContext";
import { useGetTopSellers } from "@/hooks/queries/useUserQueries";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import { useBanners } from "@/hooks/queries/useBannerQueries";
import { Categories } from "./categories";
import { ImageSlider } from "./ImagesSlider";
import { TopSellers } from "./TopSellers";

// Fallback images used only when the banners endpoint returns nothing, so the
// slider is never empty.
const fallbackSliderImages = [
  "/images/buyer1.png",
  "/images/buyer2.png",
  "/images/buyer3.png",
  "/images/buyer4.png",
];

// Data for the right div (Top Sellers) will be fetched via API

export const BuyersHeader: React.FC = () => {
  // State for the image slider
  const [currentSlide, setCurrentSlide] = useState(0);

  // State for the active dropdown category
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // State for the selected category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // State for the selected subcategory
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null
  );

  // State for the quick access path
  const [quickAccessPath, setQuickAccessPath] = useState<string[]>(["Home"]);

  // Use the FollowingContext
  const { loadingStates, isFollowing, toggleFollow } = useFollowing();

  // Homepage banners (B3) — fall back to local images if none returned.
  // A banner can come back with no imageUrl at all, and passing that straight
  // through rendered <Image src="">, which makes the browser re-request the
  // whole page. Keep only banners that actually carry an image.
  const { data: banners = [] } = useBanners();
  const bannerImages = banners
    .map((b) => b.imageUrl)
    .filter((url): url is string => typeof url === "string" && url.trim() !== "");
  const sliderImages = bannerImages.length ? bannerImages : fallbackSliderImages;

  // Fetch top sellers
  const { data: topSellersResponse } = useGetTopSellers();
  const rawTopSellers = topSellersResponse?.data || [];
  
  // Map API response to expected Seller format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topSellers = rawTopSellers.map((seller: any) => ({
    id: seller.sellerId || seller._id || seller.id,
    name: seller.name,
    image: seller.image || "/images/sellersProfiles.png",
    rating: seller.rating || 0,
    storeLink: `/store/${seller.sellerId || seller._id}`,
  }));

  // Categories and their subcategories (shared reference data — §7.2)
  const { data: apiCategories = [] } = useCategories();

  const categories: string[] = apiCategories.map((c) => c.name);

  // Keyed by category name so `subCategories[name]` always resolves to an
  // array (the Categories child reads `.length` directly).
  const subCategories: Record<string, string[]> = Object.fromEntries(
    apiCategories.map((c) => [c.name, c.subcategories.map((s) => s.name)]),
  );

  // Render star rating
  const renderStars = (rating: number) => {
    const stars: React.ReactNode[] = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        i < rating ? <YellowStarIcon key={i} /> : <StarIcon key={i} />
      );
    }
    return stars;
  };

  // Handle clicks on quick access path items
  const handlePathItemClick = (clickedItem: string) => {
    const currentPath = [...quickAccessPath];
    const itemIndex = currentPath.indexOf(clickedItem);

    if (clickedItem === "Home") {
      // Reset to Home state
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setActiveDropdown(null);
      setQuickAccessPath(["Home"]);
    } else if (itemIndex < currentPath.length - 1) {
      // Navigate back to the clicked category or subcategory level
      const newPath = currentPath.slice(0, itemIndex + 1);
      setQuickAccessPath(newPath);

      if (newPath.length === 2) {
        // Navigating back to a category level (e.g., "Home > Grains")
        setSelectedCategory(newPath[1]);
        setSelectedSubCategory(null);
        setActiveDropdown(newPath[1]);
      } else if (newPath.length === 1) {
        // Navigating to Home
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        setActiveDropdown(null);
      }
    }
    // Do nothing if clicking the current item (last item in path)
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategory !== category) {
      setSelectedCategory(category);
      setSelectedSubCategory(null);
      setActiveDropdown(category);
      setQuickAccessPath(["Home", category]);
    }
  };

  const handleSubCategoryClick = (subCat: string, category: string) => {
    setSelectedCategory(category);
    setSelectedSubCategory(subCat);
    setActiveDropdown(null);
    setQuickAccessPath(["Home", category, subCat]);
  };

  return (
    <div className="w-[90%] mx-auto py-6 font-montserrat">
      <div className="flex items-center gap-[0.15rem] mb-2">
        {quickAccessPath.map((item, index) => (
          <React.Fragment key={index}>
            <span
              className={`cursor-pointer text-[#2B2B2B] text-[0.6rem] sm:text-[0.7rem] md:text-[0.89rem] font-normal ${
                index === quickAccessPath.length - 1
                  ? "pointer-events-none text-[#2B2B2B]" // Disable click on the current item
                  : "hover:text-[#538E53] transition"
              }`}
              onClick={() => handlePathItemClick(item)}
            >
              {item}
            </span>
            {index < quickAccessPath.length - 1 && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2b2b2b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] md:w-[19px] md:h-[19px]  "
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full">
      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Left Div: Categories */}
        <Categories
          categories={categories}
          subCategories={subCategories}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedSubCategory={selectedSubCategory}
          setSelectedSubCategory={setSelectedSubCategory}
          handleCategoryClick={handleCategoryClick}
          handleSubCategoryClick={handleSubCategoryClick}
        />

        {/* Center Div: Image Slider */}
        <ImageSlider
          sliderImages={sliderImages}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          />
        </div>

        {/* Right Div: Promotional Section */}
        <TopSellers
          topSellers={topSellers}
          loadingStates={loadingStates}
          isFollowing={isFollowing}
          toggleFollow={toggleFollow}
          renderStars={renderStars}
        />
      </div>
    </div>
  );
};
