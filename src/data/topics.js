/**
 * @file topics.js
 * @module Topics
 * @description Static metadata for the 20 topic tiles (id, title, emoji, color). Titles use functional framing ("Greet someone", "Order food") rather than lexical categories, to match how sentences are presented in real interactions. No vocabulary here — words/sentences live in vocab-data.json keyed by the same id.
 * @exports
 *   - TOPICS: array of {id, title, emoji, color}
 * @depends (none)
 * @connects Rendered on the home grid in App.jsx; keys match vocab-data.json and determine the order of topics.
 */
export const TOPICS = [
  { id: "pronouns", title: "Pronouns", emoji: "👤", color: "#8B5CF6" },
  { id: "qwords", title: "Question words", emoji: "❓", color: "#EAB308" },
  { id: "verbs", title: "Talk about actions", emoji: "🏃", color: "#DC2626" },
  { id: "greetings", title: "Greet someone", emoji: "🙏", color: "#D94F3B" },
  { id: "emotions", title: "Share how you feel", emoji: "💛", color: "#D9A13B" },
  { id: "questions", title: "Ask a question", emoji: "❓", color: "#7C3AED" },
  { id: "numbers", title: "Count & tell time", emoji: "🔢", color: "#8B5CF6" },
  { id: "food", title: "Order food", emoji: "🍛", color: "#3BAF5C" },
  { id: "family", title: "Talk about family", emoji: "👨‍👩‍👧‍👦", color: "#3B82D9" },
  { id: "colors", title: "Describe things", emoji: "🎨", color: "#EC4899" },
  { id: "movies", title: "Talk about movies", emoji: "🎬", color: "#E11D48" },
  { id: "body", title: "Talk about health", emoji: "🏥", color: "#EF4444" },
  { id: "daily", title: "Talk about your day", emoji: "☀️", color: "#F97316" },
  { id: "home", title: "Things around home", emoji: "🏠", color: "#6366F1" },
  { id: "nature", title: "Talk about weather", emoji: "🌿", color: "#10B981" },
  { id: "travel", title: "Get around", emoji: "🚌", color: "#F59E0B" },
  { id: "shopping", title: "Shop & bargain", emoji: "🛒", color: "#14B8A6" },
  { id: "work", title: "Work & study", emoji: "📚", color: "#6D28D9" },
  { id: "places", title: "Find places", emoji: "🏛️", color: "#0D9488" },
  { id: "clothing", title: "Talk about clothes", emoji: "👔", color: "#0EA5E9" },
  { id: "animals", title: "Talk about animals", emoji: "🐘", color: "#A3622A" },
  { id: "phrases", title: "Everyday reactions", emoji: "💬", color: "#BE185D" },
];
