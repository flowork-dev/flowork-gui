//#######################################################################
//# WEBSITE https://flowork.cloud
//# File NAME : C:\FLOWORK\flowork-gui\template\web\src\utils\debounce.js
//# CATATAN: File BARU untuk helper debounce.
//#######################################################################

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was invoked.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @returns {Function} Returns the new debounced function.
 */
export function debounce(func, wait) {
  let timeout;

  // This is the function that will be returned and used as the debounced function
  return function executedFunction(...args) {
    // The function to be executed after the debounce time
    const later = () => {
      // Clear the timeout variable as the function has executed
      clearTimeout(timeout);
      // Execute the original function with the saved arguments and context
      func(...args);
    };

    // Clear the timeout if it exists, effectively resetting the debounce timer
    clearTimeout(timeout);
    // Set a new timeout to execute the 'later' function after 'wait' milliseconds
    timeout = setTimeout(later, wait);
  };
}