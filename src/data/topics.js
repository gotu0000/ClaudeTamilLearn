/**
 * @file topics.js
 * @module Topics
 * @description Static metadata for the 20 topic tiles (id, title, emoji, color). No vocabulary here — words/sentences live in vocab-data.json keyed by the same id.
 * @exports
 *   - TOPICS: array of {id, title, emoji, color}
 * @depends (none)
 * @connects Rendered on the home grid in App.jsx; keys match vocab-data.json and determine the order of topics.
 */
export const TOPICS = [
  { id: "verbs", title: "Common Verbs", emoji: "🏃", color: "#DC2626" },
  { id: "greetings", title: "Greetings & Basics", emoji: "🙏", color: "#D94F3B" },
  { id: "emotions", title: "Emotions", emoji: "💛", color: "#D9A13B" },
  { id: "questions", title: "Questions & Connectors", emoji: "❓", color: "#7C3AED" },
  { id: "numbers", title: "Numbers & Time", emoji: "🔢", color: "#8B5CF6" },
  { id: "food", title: "Food & Drink", emoji: "🍛", color: "#3BAF5C" },
  { id: "family", title: "Family & People", emoji: "👨‍👩‍👧‍👦", color: "#3B82D9" },
  { id: "colors", title: "Colors & Adjectives", emoji: "🎨", color: "#EC4899" },
  { id: "movies", title: "Movie & Entertainment", emoji: "🎬", color: "#E11D48" },
  { id: "body", title: "Body & Health", emoji: "🏥", color: "#EF4444" },
  { id: "daily", title: "Daily Routines", emoji: "☀️", color: "#F97316" },
  { id: "home", title: "Home & Objects", emoji: "🏠", color: "#6366F1" },
  { id: "nature", title: "Nature & Weather", emoji: "🌿", color: "#10B981" },
  { id: "travel", title: "Travel & Directions", emoji: "🚌", color: "#F59E0B" },
  { id: "shopping", title: "Shopping & Money", emoji: "🛒", color: "#14B8A6" },
  { id: "work", title: "Work & Education", emoji: "📚", color: "#6D28D9" },
  { id: "places", title: "Places & Buildings", emoji: "🏛️", color: "#0D9488" },
  { id: "clothing", title: "Clothing", emoji: "👔", color: "#0EA5E9" },
  { id: "animals", title: "Animals", emoji: "🐘", color: "#A3622A" },
  { id: "phrases", title: "Useful Phrases", emoji: "💬", color: "#BE185D" },
];
