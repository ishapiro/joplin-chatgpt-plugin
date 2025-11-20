# Debugging Settings Dropdown and Textarea

## Quick Debug Steps

### 1. Check Joplin Console Logs

1. Open Joplin
2. Go to **Help** → **Toggle Developer Tools** (or press `Ctrl+Shift+I` / `Cmd+Option+I` on Mac)
3. Go to the **Console** tab
4. **Reload the plugin**:
   - Go to **Tools** → **Options** → **Plugins**
   - Find "ChatGPT Toolkit"
   - Click **Disable**, then **Enable** again
5. Look for these log messages in the console:
   - `"Settings dropdown options:"` - Should show the options object with all models
   - `"Number of model options:"` - Should show count (should be 15+ including the blank option)
   - `"Settings registered successfully"` - Confirms settings were registered
   - `"Model setting options count:"` - Should match number of models
   - `"System prompt inputType:"` - Should show "textarea"

### 2. Verify Compiled Code

The compiled code in `dist/index.js` should include:
- Line ~458: `options: settingsModelOptions,` for the model setting
- Line ~475: `inputType: 'textarea',` for the systemPrompt setting

**Verified**: Both properties are present in the compiled code ✓

### 3. Check Joplin Version

The `options` and `inputType` properties require **Joplin 2.12 or higher**.

Check your version:
- **Help** → **About Joplin**
- Should show version 2.12.x or higher

### 4. Verify Settings Object Structure

In the console, after plugin loads, check:

```javascript
// The options should be an object like:
{
  '': '(Auto-select latest general model)',
  'gpt-5.1': 'GPT-5.1 (Latest)',
  'gpt-5': 'Gpt 5',
  // ... etc
}
```

### 5. Common Issues and Solutions

**Issue: Dropdown shows as text field**
- ✅ **Solution**: Verify Joplin version is 2.12+
- ✅ **Solution**: Completely restart Joplin (not just reload plugin)
- ✅ **Solution**: Check console for errors during settings registration

**Issue: Textarea shows as single-line input**
- ✅ **Solution**: Verify `inputType: 'textarea'` is in compiled code (it is)
- ✅ **Solution**: Try clearing Joplin's plugin cache and reloading

**Issue: Options object is empty**
- Check console log: `"Number of model options:"` - should be 15+
- If 0 or 1, models aren't being loaded correctly
- Check if models are stored: Look for `"Loaded X models for settings dropdown"` in console

### 6. Manual Verification

After reloading plugin:
1. Go to **Tools** → **Options** → **Plugins** → **ChatGPT Toolkit**
2. **Model field**: Should show as a **dropdown/select** (not text input)
3. **System Prompt field**: Should show as a **textarea** with scrollbars (not single-line)

### 7. If Still Not Working

**Try these steps in order:**

1. **Restart Joplin completely** (close and reopen)
2. **Clear plugin cache**:
   - Close Joplin
   - Delete: `~/.config/joplin-desktop/plugins/com.cogitations.chatgpt-toolkit/`
   - Restart Joplin and re-enable plugin
3. **Check for console errors**: Look for red error messages
4. **Verify Joplin version**: Must be 2.12 or higher
5. **Check if other plugins work**: Test if dropdowns work in other plugins

### 8. Debug Output to Check

When plugin loads, you should see in console:
```
Loaded X models for settings dropdown
Settings dropdown options: { "": "(Auto-select latest general model)", "gpt-5.1": "GPT-5.1 (Latest)", ... }
Number of model options: 15
Settings registered successfully
Model setting options count: 15
System prompt inputType: textarea
```

If any of these are missing or show wrong values, that's the issue.

### 2. Verify Settings Registration

In the console, you can also check if settings were registered correctly:

```javascript
// Check if settings exist
await joplin.settings.value('openaiModel')
await joplin.settings.value('systemPrompt')
```

### 3. Check for Errors

Look for any red error messages in the console that might indicate:
- Settings registration failures
- Type mismatches
- Missing properties

### 4. Verify Joplin Version

The `options` and `inputType` properties require Joplin 2.12 or higher (as specified in `app_min_version`).

Check your Joplin version:
- **Help** → **About Joplin**

### 5. Check Compiled Code

The compiled JavaScript in `dist/index.js` should include:
- `options: settingsModelOptions` for the model setting
- `inputType: 'textarea'` for the systemPrompt setting

### 6. Common Issues

**Dropdown not showing:**
- Verify `options` is an object (not array): `{ 'key': 'Label' }`
- Check that options object is not empty
- Ensure Joplin version supports dropdowns (2.12+)

**Textarea not showing:**
- Verify `inputType: 'textarea'` is set (not `inputType: "textarea"` - though both should work)
- Check Joplin version supports textarea (2.12+)
- Try reloading the plugin

### 7. Manual Test

After reloading the plugin:
1. Go to **Tools** → **Options** → **Plugins** → **ChatGPT Toolkit**
2. Check if:
   - Model field shows as a dropdown (not text field)
   - System Prompt shows as a textarea (not single-line input)

### 8. If Still Not Working

If the properties are in the compiled code but not working:
- Try restarting Joplin completely
- Check if there are any Joplin version compatibility issues
- Verify the settings section is being created correctly

