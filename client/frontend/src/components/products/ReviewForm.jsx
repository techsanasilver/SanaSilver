import { useState } from "react";
import { FaStar } from "react-icons/fa";

const MAX_BODY_LENGTH = 1000;
const MIN_BODY_LENGTH = 10;
const MAX_TITLE_LENGTH = 100;

export default function ReviewForm({
    onSubmit,
    onCancel,
    initialData = null,
    submitting = false,
}) {
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState(initialData?.title || "");
    const [body, setBody] = useState(initialData?.body || "");
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!rating || rating < 1 || rating > 5) {
            newErrors.rating = "Please select a rating.";
        }
        if (body.trim().length < MIN_BODY_LENGTH) {
            newErrors.body = `Review must be at least ${MIN_BODY_LENGTH} characters.`;
        }
        if (body.trim().length > MAX_BODY_LENGTH) {
            newErrors.body = `Review must not exceed ${MAX_BODY_LENGTH} characters.`;
        }
        if (title.length > MAX_TITLE_LENGTH) {
            newErrors.title = `Title must not exceed ${MAX_TITLE_LENGTH} characters.`;
        }
        return newErrors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        onSubmit({
            rating,
            title: title.trim() || undefined,
            body: body.trim(),
        });
    };

    const displayRating = hoveredRating || rating;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Picker */}
            <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                    Your Rating <span className="text-danger">*</span>
                </label>
                <div
                    className="flex gap-1"
                    onMouseLeave={() => setHoveredRating(0)}
                >
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            disabled={submitting}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            className="text-2xl focus:outline-none disabled:cursor-not-allowed transition-transform hover:scale-110"
                            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                        >
                            <FaStar
                                className={
                                    star <= displayRating
                                        ? "text-accent-2"
                                        : "text-text-secondary opacity-30"
                                }
                            />
                        </button>
                    ))}
                </div>
                {errors.rating && (
                    <p className="mt-1 text-sm text-danger">{errors.rating}</p>
                )}
            </div>

            {/* Title */}
            <div>
                <label
                    htmlFor="review-title"
                    className="block text-sm font-medium text-text-primary mb-1"
                >
                    Title{" "}
                    <span className="text-text-secondary text-xs">
                        (optional)
                    </span>
                </label>
                <input
                    id="review-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={submitting}
                    maxLength={MAX_TITLE_LENGTH}
                    placeholder="Summarise your experience"
                    className="w-full px-3 py-2 border border-divider rounded bg-background-primary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-1 disabled:opacity-60 text-sm"
                />
                {errors.title && (
                    <p className="mt-1 text-sm text-danger">{errors.title}</p>
                )}
            </div>

            {/* Body */}
            <div>
                <label
                    htmlFor="review-body"
                    className="block text-sm font-medium text-text-primary mb-1"
                >
                    Review <span className="text-danger">*</span>
                </label>
                <textarea
                    id="review-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={submitting}
                    rows={4}
                    placeholder="Share your experience with this product..."
                    className="w-full px-3 py-2 border border-divider rounded bg-background-primary text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent-1 disabled:opacity-60 text-sm resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                    {errors.body ? (
                        <p className="text-sm text-danger">{errors.body}</p>
                    ) : (
                        <span />
                    )}
                    <span
                        className={`text-xs ${
                            body.length > MAX_BODY_LENGTH
                                ? "text-danger"
                                : "text-text-secondary"
                        }`}
                    >
                        {body.length}/{MAX_BODY_LENGTH}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-text-primary text-background-primary text-sm tracking-widest uppercase font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting
                        ? "Submitting..."
                        : initialData
                          ? "Update Review"
                          : "Submit Review"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitting}
                    className="flex-1 py-2 border border-divider text-text-primary text-sm tracking-widest uppercase font-medium hover:bg-background-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
