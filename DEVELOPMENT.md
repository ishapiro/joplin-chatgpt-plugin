# ChatGPT Toolkit Plugin - Development Guide

## 🏗️ **Project Structure**

```
joplin-chatgpt-plugin/
├── src/                    # Source files
│   └── index.js           # Main plugin implementation (JavaScript)
├── dist/                  # Distribution files (generated)
│   ├── index.js          # Copied from src/
│   └── manifest.json     # Generated from package.json
├── test/                  # Test files
├── build.js              # Build script (generates manifest.json)
├── package.json          # Project configuration
└── joplin-plugin-chatgpt.jpl  # Plugin package (generated)
```

## 🚀 **Build Process**

### **Development Workflow:**
```bash
# Quick development deployment (no .jpl file)
npm run dev

# Full build with .jpl package
npm run build

# Deploy to Joplin
npm run deploy
```

### **Build Steps:**
1. **Clean** - Remove old dist files
2. **Generate Manifest** - Create `manifest.json` from `package.json`
3. **Copy Source** - Copy `src/index.js` to `dist/`
4. **Create Package** - Generate `.jpl` file from dist contents

## 📝 **Available Scripts**

| Script | Description |
|--------|-------------|
| `npm run build` | Full build with .jpl package |
| `npm run dev` | Quick development deployment |
| `npm run deploy` | Build and deploy to Joplin |
| `npm run clean` | Clean dist directory |
| `npm run generate-manifest` | Generate manifest.json |
| `npm run copy-src` | Copy source files to dist |
| `npm run create-jpl` | Create .jpl package |
| `npm test` | Run tests |

## 🔧 **Development**

### **Making Changes:**
1. Edit `src/index.js` (the main plugin file)
2. Run `npm run dev` for quick testing
3. Run `npm run build` for full build with .jpl package

### **Plugin Configuration:**
- Edit the `joplin` section in `package.json`
- The `build.js` script automatically generates `manifest.json` from this configuration

## 📦 **Distribution**

### **For Users:**
- **Option 1**: Install from `joplin-plugin-chatgpt.jpl` file
- **Option 2**: Copy `dist/` folder to Joplin plugins directory

### **For Developers:**
- Source code is in `src/index.js`
- Build process handles all distribution files
- `.jpl` file is automatically generated in project root

## ✅ **Benefits of This Structure**

1. **Clean Separation** - Source vs distribution files
2. **Automated Build** - No manual file copying
3. **Version Control** - Only source files tracked
4. **Easy Deployment** - Single command deployment
5. **Plugin Package** - .jpl file for easy distribution
6. **No TypeScript Complexity** - Pure JavaScript implementation

## 🎯 **Current Status**

- ✅ **Pure JavaScript** - No TypeScript compilation needed
- ✅ **Automated Build** - Single command builds everything
- ✅ **Plugin Package** - .jpl file generated automatically
- ✅ **Clean Structure** - Proper src/dist separation
- ✅ **Easy Deployment** - Multiple deployment options
