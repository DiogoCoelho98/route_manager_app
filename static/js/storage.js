/**
 * Utility functions for interacting with sessionStorage, 
 * providing safe and error-handling methods for 
 * setting, getting, and removing items.
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
