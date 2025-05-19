
/**
 * Utility functions for interacting with sessionStorage,
 * providing safe, error-handling methods for setting, getting,
 * and removing items. All data is serialized/deserialized as JSON.
 */



/**
 * Sets a value in sessionStorage under the given key.
 * Serializes the value as JSON.
 * @param {string} key - The sessionStorage key.
 * @param {*} value - The value to store.
 */
export const setItem = (key, value) => 
{
    try 
    {
        sessionStorage.setItem(key, JSON.stringify(value));
    } 
    catch (error) 
    {
        console.error(`Error setting item ${key} to session storage:`, error);
    }
};


/**
 * Retrieves a value from sessionStorage by key.
 * Parses the value from JSON.
 * @param {string} key - The sessionStorage key.
 * @returns {*} The parsed value, or null if not found or error.
 */
export const getItem = (key) => 
{
    try 
    {
        const value = sessionStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } 
    catch (error) 
    {
        console.error(`Error getting item ${key} from session storage:`, error);
        return null;
    }
};


/**
 * Safely removes an item from sessionStorage by key.
 * @param {string} key - The sessionStorage key.
 */
export const removeItem = (key) => 
{
    try 
    {
        sessionStorage.removeItem(key);
    } 
    catch (error) 
    {
        console.error(`Error removing item ${key} from session storage:`, error);
    }
};
