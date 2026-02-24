import CheckboxFilter from "./CheckboxFilter";
import SingleCheckboxFilter from "./SingleCheckboxFilter";

/**
 * Category filter with subcategory support
 * Category is single-select (checkbox), subcategory is multi-select (checkbox)
 */
const CategoryFilter = ({
    categories = [],
    category,
    subcategory,
    onCategoryChange,
    onSubcategoryChange,
}) => {
    // Extract parent categories (those without parent or at root level)
    // Store as objects with lowercase value and original label
    const parentCategories = categories
        .filter((cat) => !cat.parent)
        .map((cat) => ({
            value: cat.name.toLowerCase(),
            label: cat.name,
        }));

    // Category is now a single value (string), not an array - lowercase
    const selectedCategory = category || null;

    // Find the selected category object (compare lowercase)
    const selectedCategoryObj = selectedCategory
        ? categories.find(
              (cat) =>
                  cat.name.toLowerCase() === selectedCategory.toLowerCase(),
          )
        : null;

    // Get subcategories from the children - lowercase value, original label
    const availableSubcategories =
        selectedCategoryObj?.children?.map((child) => ({
            value: child.name.toLowerCase(),
            label: child.name,
        })) || [];

    return (
        <>
            <SingleCheckboxFilter
                title="Category"
                options={parentCategories}
                selectedValue={category || null}
                onChange={onCategoryChange}
            />

            {availableSubcategories && availableSubcategories.length > 0 && (
                <CheckboxFilter
                    title="Subcategory"
                    options={availableSubcategories}
                    selectedValues={subcategory || []}
                    onChange={onSubcategoryChange}
                />
            )}
        </>
    );
};

export default CategoryFilter;
