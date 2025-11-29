# VerticalSwipePager Component

A TikTok/Douyin-like vertical swipe pager component for React Native (Expo).

## Installation

First, install the required dependency:

```bash
npm install react-native-pager-view
# or
yarn add react-native-pager-view
```

For Expo projects, you may need to run:

```bash
npx expo install react-native-pager-view
```

## Basic Usage

```jsx
import VerticalSwipePager from './components/VerticalSwipePager';

const data = [
  { id: '1', title: 'Item 1', color: '#FF6B6B' },
  { id: '2', title: 'Item 2', color: '#4ECDC4' },
  { id: '3', title: 'Item 3', color: '#45B7D1' },
];

function MyScreen() {
  return (
    <VerticalSwipePager
      data={data}
      renderItem={({ item, index }) => (
        <View style={{ flex: 1, backgroundColor: item.color }}>
          <Text>{item.title}</Text>
        </View>
      )}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `Array` | `[]` | Array of items to display |
| `renderItem` | `Function` | **required** | Function to render each item: `({ item, index }) => ReactNode` |
| `initialPage` | `Number` | `0` | Initial page index |
| `onPageSelected` | `Function` | `undefined` | Callback when page changes: `(index) => void` |
| `onLoadNext` | `Function` | `undefined` | Async function to load next items: `(currentIndex) => Promise<Array>` |
| `onLoadPrevious` | `Function` | `undefined` | Async function to load previous items: `(currentIndex) => Promise<Array>` |
| `preloadCount` | `Number` | `1` | Number of pages to preload on each side |
| `loadingComponent` | `ReactNode` | `undefined` | Custom loading component |

## Features

### 1. Full-Screen Pages
Each page occupies 100% of the screen height. No half-visible items.

### 2. Vertical Swipe Navigation
- Swipe **UP** to go to the next item
- Swipe **DOWN** to go to the previous item
- Smooth snap animation like TikTok

### 3. Dynamic Loading
Load items on-demand as the user scrolls:

```jsx
<VerticalSwipePager
  data={items}
  renderItem={renderItem}
  onLoadNext={async (currentIndex) => {
    // Fetch next items from API
    const response = await fetch(`/api/items?after=${currentIndex}`);
    return response.data;
  }}
  onLoadPrevious={async (currentIndex) => {
    // Fetch previous items from API
    const response = await fetch(`/api/items?before=${currentIndex}`);
    return response.data;
  }}
/>
```

### 4. Preloading
Automatically preloads adjacent pages for smooth transitions:

```jsx
<VerticalSwipePager
  data={items}
  renderItem={renderItem}
  preloadCount={2} // Preload 2 pages on each side
/>
```

### 5. Page Selection Callback
Track which page is currently visible:

```jsx
<VerticalSwipePager
  data={items}
  renderItem={renderItem}
  onPageSelected={(index) => {
    console.log(`Current page: ${index}`);
    // Update analytics, mark as viewed, etc.
  }}
/>
```

## Complete Example

See `example/VerticalSwipePagerExample.js` for a complete working example with:
- Dynamic loading
- Custom styling
- Page selection tracking
- Loading states

## Integration with WordDetailScreen

You can replace the current ScrollView-based implementation in `WordDetailScreen.js` with this component:

```jsx
import VerticalSwipePager from '../components/VerticalSwipePager';

// In WordDetailScreen component:
<VerticalSwipePager
  data={allWords}
  renderItem={({ item, index }) => (
    <WordDetailContent word={item} />
  )}
  initialPage={currentWordIndex}
  onPageSelected={(index) => {
    const newWord = allWords[index];
    // Update state, navigation params, etc.
  }}
/>
```

## Notes

- Uses `react-native-pager-view` for native performance
- Works with Expo (latest SDK)
- Each page must be full-screen (100% height)
- Pages are not scrollable internally (use nested ScrollView if needed)
- Smooth snap animations are handled by PagerView

## Troubleshooting

### Page not switching
- Ensure each page has `height: SCREEN_HEIGHT` or `flex: 1`
- Check that `data` array is not empty
- Verify `renderItem` returns a valid React component

### Performance issues
- Reduce `preloadCount` if you have many items
- Implement lazy loading for heavy content
- Use `React.memo` for `renderItem` if needed

### Animation not smooth
- Ensure you're using the native `react-native-pager-view` (not a polyfill)
- Check that pages have consistent heights
- Avoid heavy computations in `renderItem`

