# Translation Ranking Annotator

## 🔐 Owner Password Configuration

**Default Password:** `admin123`

To change the owner password:
1. Open `script.js`
2. Find the line: `this.ownerPassword = 'admin123';` (around line 23)
3. Replace `'admin123'` with your desired password
4. Save the file

Example:
```javascript
this.ownerPassword = 'mySecurePassword123';
```

---

# Translation Ranking Annotator

A modern web application for collecting annotations of rankings for multiple translation options. This tool allows users to compare different translations and rank them from best to worst using an intuitive drag-and-drop interface.

## Features

- **Drag & Drop Ranking**: Easily reorder translation options by dragging them
- **Interactive Editing**: Click or double-click any translation to edit its content
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Export Functionality**: Export rankings as JSON files for analysis
- **Keyboard Shortcuts**: Quick access to common functions
- **Sample Data**: Pre-loaded with example translations to get started quickly

## Getting Started

1. **Open the Application**: Simply open `index.html` in your web browser
2. **View Sample Data**: The app comes with sample translations in multiple languages
3. **Start Ranking**: Drag and drop the translation options to rank them from best (top) to worst (bottom)
4. **Edit Translations**: Click the edit button or double-click any translation to modify its content
5. **Add More Options**: Use the "Add Translation Option" button to include additional translations
6. **Export Results**: Click "Export Annotations" to download your rankings as a JSON file

## Usage Instructions

### Ranking Translations
- **Drag & Drop**: Click and drag any translation option to reorder them
- **Visual Feedback**: The interface provides visual cues during dragging
- **Rank Numbers**: Each translation shows its current rank position

### Editing Translations
- **Click to Edit**: Click the edit button (pencil icon) on any translation
- **Double-Click**: Double-click anywhere on a translation to edit it
- **Modal Interface**: Edit translations in a clean modal dialog
- **Save Changes**: Use Ctrl+Enter or click Save to confirm changes

### Managing Translations
- **Add New**: Click "Add Translation Option" to create new translations
- **Clear All**: Use "Clear All" to remove all translations (with confirmation)
- **Export Data**: Download your rankings as a structured JSON file

## Keyboard Shortcuts

- **Ctrl/Cmd + N**: Add new translation option
- **Ctrl/Cmd + S**: Export annotations
- **Ctrl/Cmd + Enter**: Save changes in edit modal
- **Escape**: Close edit modal

## Export Format

The exported JSON file includes:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sourceText": "Original text to be translated",
  "translations": [
    {
      "rank": 1,
      "text": "Best translation option",
      "id": "unique_identifier"
    }
  ],
  "totalTranslations": 4
}
```

## Technical Details

- **Pure HTML/CSS/JavaScript**: No external dependencies required
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern CSS**: Uses CSS Grid, Flexbox, and modern styling techniques
- **Drag & Drop API**: Native HTML5 drag and drop functionality
- **Local Storage**: No data is sent to external servers

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Structure

```
translation-annotator/
├── index.html          # Main HTML file
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

## Customization

### Adding Sample Translations
Edit the `addSampleTranslations()` method in `script.js` to include your own sample data.

### Styling Changes
Modify `styles.css` to customize colors, fonts, and layout according to your preferences.

### Source Text
Update the source text in `index.html` to match your specific translation task.

## Use Cases

- **Translation Quality Assessment**: Compare different translation approaches
- **Language Learning**: Evaluate student translations
- **Research**: Collect data for translation studies
- **Crowdsourcing**: Gather community rankings of translations
- **A/B Testing**: Compare different translation versions

## Contributing

Feel free to modify and extend this application for your specific needs. The code is well-commented and structured for easy customization.

## License

This project is open source and available under the MIT License.
