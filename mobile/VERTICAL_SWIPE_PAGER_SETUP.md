# VerticalSwipePager Setup Guide

## Installation

1. **Install the dependency:**

```bash
cd mobile
npm install react-native-pager-view
# or
yarn add react-native-pager-view
```

For Expo projects, use:

```bash
npx expo install react-native-pager-view
```

2. **Rebuild your app:**

```bash
# For iOS
npx expo prebuild --clean
# or
npm run ios

# For Android
npm run android
```

## Quick Start

```jsx
import VerticalSwipePager from './src/components/VerticalSwipePager';

const items = [
  { id: '1', title: 'Item 1' },
  { id: '2', title: 'Item 2' },
  { id: '3', title: 'Item 3' },
];

function MyScreen() {
  return (
    <VerticalSwipePager
      data={items}
      renderItem={({ item, index }) => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>{item.title}</Text>
        </View>
      )}
    />
  );
}
```

## Files Created

1. **`src/components/VerticalSwipePager.js`** - Main component
2. **`src/components/example/VerticalSwipePagerExample.js`** - Complete example
3. **`src/components/VERTICAL_SWIPE_PAGER_README.md`** - Full documentation

## Features

✅ Full-screen pages (100% height)
✅ Vertical swipe (up = next, down = previous)
✅ Smooth snap animation
✅ Dynamic loading (onLoadNext, onLoadPrevious)
✅ Preloading support
✅ Page selection callback
✅ Works with Expo

## Next Steps

1. Install `react-native-pager-view`
2. Review the example in `src/components/example/VerticalSwipePagerExample.js`
3. Integrate into your screens as needed

