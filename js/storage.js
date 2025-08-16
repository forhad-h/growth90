/**
 * Growth90 Storage System
 * IndexedDB-based storage with multi-tier architecture
 */

(function(Growth90) {
    'use strict';

    // Storage system configuration
    const STORAGE_CONFIG = {
        dbName: 'Growth90DB',
        dbVersion: 1,
        stores: {
            userProfiles: { keyPath: 'id', autoIncrement: false },
            learningPaths: { keyPath: 'id', autoIncrement: false },
            learningProgress: { keyPath: 'id', autoIncrement: false },
            assessments: { keyPath: 'id', autoIncrement: false },
            contentCache: { keyPath: 'id', autoIncrement: false },
            settings: { keyPath: 'key', autoIncrement: false },
            analytics: { keyPath: 'id', autoIncrement: true }
        },
        indices: {
            userProfiles: [
                { name: 'email', keyPath: 'email', unique: true },
                { name: 'createdAt', keyPath: 'createdAt', unique: false }
            ],
            learningPaths: [
                { name: 'userId', keyPath: 'userId', unique: false },
                { name: 'status', keyPath: 'status', unique: false },
                { name: 'createdAt', keyPath: 'createdAt', unique: false }
            ],
            learningProgress: [
                { name: 'userId', keyPath: 'userId', unique: false },
                { name: 'pathId', keyPath: 'pathId', unique: false },
                { name: 'date', keyPath: 'date', unique: false }
            ],
            assessments: [
                { name: 'userId', keyPath: 'userId', unique: false },
                { name: 'pathId', keyPath: 'pathId', unique: false },
                { name: 'type', keyPath: 'type', unique: false }
            ],
            contentCache: [
                { name: 'type', keyPath: 'type', unique: false },
                { name: 'expiresAt', keyPath: 'expiresAt', unique: false }
            ],
            analytics: [
                { name: 'userId', keyPath: 'userId', unique: false },
                { name: 'event', keyPath: 'event', unique: false },
                { name: 'timestamp', keyPath: 'timestamp', unique: false }
            ]
        }
    };

    // IndexedDB Storage Layer
    Growth90.Data.Storage = (() => {
        let db = null;
        let isInitialized = false;
        const initPromise = initializeDatabase();

        async function initializeDatabase() {
            return new Promise((resolve, reject) => {
                try {
                    const request = indexedDB.open(STORAGE_CONFIG.dbName, STORAGE_CONFIG.dbVersion);

                    request.onerror = () => {
                        reject(new Error(`Failed to open database: ${request.error}`));
                    };

                    request.onsuccess = () => {
                        db = request.result;
                        isInitialized = true;
                        Growth90.Core.EventBus.emit('storage:initialized');
                        resolve(db);
                    };

                    request.onupgradeneeded = (event) => {
                        db = event.target.result;
                        
                        // Create object stores
                        Object.entries(STORAGE_CONFIG.stores).forEach(([storeName, storeConfig]) => {
                            if (!db.objectStoreNames.contains(storeName)) {
                                const store = db.createObjectStore(storeName, storeConfig);
                                
                                // Create indices
                                if (STORAGE_CONFIG.indices[storeName]) {
                                    STORAGE_CONFIG.indices[storeName].forEach(indexConfig => {
                                        store.createIndex(indexConfig.name, indexConfig.keyPath, {
                                            unique: indexConfig.unique
                                        });
                                    });
                                }
                                
                            }
                        });
                    };

                    request.onblocked = () => {
                    };

                } catch (error) {
                    reject(error);
                }
            });
        }

        async function ensureInitialized() {
            if (!isInitialized) {
                await initPromise;
            }
            return db;
        }

        // Generic CRUD operations
        async function setItem(storeName, data) {
            const database = await ensureInitialized();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = database.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    
                    // Add timestamps if not present
                    if (!data.createdAt) {
                        data.createdAt = new Date().toISOString();
                    }
                    data.updatedAt = new Date().toISOString();
                    
                    const request = store.put(data);
                    
                    request.onsuccess = () => {
                        resolve(data);
                        Growth90.Core.EventBus.emit('storage:item:set', { store: storeName, data });
                    };
                    
                    request.onerror = () => {
                        console.error(`❌ Storage.setItem failed for ${storeName}:${data.id}`, request.error);
                        reject(new Error(`Failed to store item in ${storeName}: ${request.error}`));
                    };
                    
                } catch (error) {
                    console.error(`❌ Storage.setItem exception for ${storeName}:`, error);
                    reject(error);
                }
            });
        }

        async function getItem(storeName, key) {
            const database = await ensureInitialized();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = database.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    const request = store.get(key);
                    
                    request.onsuccess = () => {
                        const result = request.result || null;
                        resolve(result);
                    };
                    
                    request.onerror = () => {
                        console.error(`❌ Storage.getItem failed for ${storeName}:${key}`, request.error);
                        reject(new Error(`Failed to get item from ${storeName}: ${request.error}`));
                    };
                    
                } catch (error) {
                    console.error(`❌ Storage.getItem exception for ${storeName}:`, error);
                    reject(error);
                }
            });
        }

        async function getAllItems(storeName, index = null, keyRange = null) {
            const database = await ensureInitialized();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = database.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    
                    let source = store;
                    if (index) {
                        source = store.index(index);
                    }
                    
                    const request = source.getAll(keyRange);
                    
                    request.onsuccess = () => {
                        resolve(request.result || []);
                    };
                    
                    request.onerror = () => {
                        reject(new Error(`Failed to get all items from ${storeName}: ${request.error}`));
                    };
                    
                } catch (error) {
                    reject(error);
                }
            });
        }

        async function deleteItem(storeName, key) {
            const database = await ensureInitialized();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = database.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.delete(key);
                    
                    request.onsuccess = () => {
                        resolve(true);
                        Growth90.Core.EventBus.emit('storage:item:deleted', { store: storeName, key });
                    };
                    
                    request.onerror = () => {
                        reject(new Error(`Failed to delete item from ${storeName}: ${request.error}`));
                    };
                    
                } catch (error) {
                    reject(error);
                }
            });
        }

        async function clearStore(storeName) {
            const database = await ensureInitialized();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = database.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();
                    
                    request.onsuccess = () => {
                        resolve(true);
                        Growth90.Core.EventBus.emit('storage:store:cleared', { store: storeName });
                    };
                    
                    request.onerror = () => {
                        reject(new Error(`Failed to clear store ${storeName}: ${request.error}`));
                    };
                    
                } catch (error) {
                    reject(error);
                }
            });
        }

        // Query operations
        async function queryItems(storeName, options = {}) {
            const { index, keyRange, direction = 'next', limit } = options;
            const database = await ensureInitialized();
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = database.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    
                    let source = store;
                    if (index) {
                        source = store.index(index);
                    }
                    
                    const results = [];
                    const request = source.openCursor(keyRange, direction);
                    
                    request.onsuccess = (event) => {
                        const cursor = event.target.result;
                        
                        if (cursor && (!limit || results.length < limit)) {
                            results.push(cursor.value);
                            cursor.continue();
                        } else {
                            resolve(results);
                        }
                    };
                    
                    request.onerror = () => {
                        reject(new Error(`Failed to query items from ${storeName}: ${request.error}`));
                    };
                    
                } catch (error) {
                    reject(error);
                }
            });
        }

        // Advanced search with filters
        async function searchItems(storeName, filterFn, options = {}) {
            const { limit } = options;
            const allItems = await getAllItems(storeName);
            
            let filteredItems = allItems.filter(filterFn);
            
            if (limit) {
                filteredItems = filteredItems.slice(0, limit);
            }
            
            return filteredItems;
        }

        // Batch operations
        async function batchOperation(operations) {
            const database = await ensureInitialized();
            const storeNames = [...new Set(operations.map(op => op.store))];
            
            return new Promise((resolve, reject) => {
                try {
                    const transaction = database.transaction(storeNames, 'readwrite');
                    const results = [];
                    let completed = 0;
                    
                    operations.forEach((operation, index) => {
                        const store = transaction.objectStore(operation.store);
                        let request;
                        
                        switch (operation.type) {
                            case 'put':
                                request = store.put(operation.data);
                                break;
                            case 'delete':
                                request = store.delete(operation.key);
                                break;
                            case 'get':
                                request = store.get(operation.key);
                                break;
                            default:
                                throw new Error(`Unknown operation type: ${operation.type}`);
                        }
                        
                        request.onsuccess = () => {
                            results[index] = request.result;
                            completed++;
                            
                            if (completed === operations.length) {
                                resolve(results);
                            }
                        };
                        
                        request.onerror = () => {
                            reject(new Error(`Batch operation failed: ${request.error}`));
                        };
                    });
                    
                } catch (error) {
                    reject(error);
                }
            });
        }

        // Database maintenance
        async function cleanup() {
            
            try {
                // Clean expired content cache
                const expiredContent = await queryItems('contentCache', {
                    index: 'expiresAt',
                    keyRange: IDBKeyRange.upperBound(new Date().toISOString())
                });
                
                for (const item of expiredContent) {
                    await deleteItem('contentCache', item.id);
                }
                
                
                // Clean old analytics data (keep last 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const oldAnalytics = await queryItems('analytics', {
                    index: 'timestamp',
                    keyRange: IDBKeyRange.upperBound(thirtyDaysAgo.toISOString())
                });
                
                for (const item of oldAnalytics) {
                    await deleteItem('analytics', item.id);
                }
                
                
                Growth90.Core.EventBus.emit('storage:cleanup:completed');
                
            } catch (error) {
                console.error('❌ Database cleanup failed:', error);
                throw error;
            }
        }

        // Export/Import functionality
        async function exportData() {
            const database = await ensureInitialized();
            const exportData = {};
            
            for (const storeName of Object.keys(STORAGE_CONFIG.stores)) {
                exportData[storeName] = await getAllItems(storeName);
            }
            
            return {
                version: STORAGE_CONFIG.dbVersion,
                timestamp: new Date().toISOString(),
                data: exportData
            };
        }

        async function importData(importData) {
            if (!importData.data) {
                throw new Error('Invalid import data format');
            }
            
            const operations = [];
            
            Object.entries(importData.data).forEach(([storeName, items]) => {
                if (STORAGE_CONFIG.stores[storeName] && Array.isArray(items)) {
                    items.forEach(item => {
                        operations.push({
                            type: 'put',
                            store: storeName,
                            data: item
                        });
                    });
                }
            });
            
            return await batchOperation(operations);
        }

        // Get storage usage statistics
        async function getStorageStats() {
            const stats = {};
            
            for (const storeName of Object.keys(STORAGE_CONFIG.stores)) {
                const items = await getAllItems(storeName);
                stats[storeName] = {
                    count: items.length,
                    size: JSON.stringify(items).length
                };
            }
            
            const totalSize = Object.values(stats).reduce((sum, store) => sum + store.size, 0);
            const totalCount = Object.values(stats).reduce((sum, store) => sum + store.count, 0);
            
            return {
                stores: stats,
                total: {
                    count: totalCount,
                    size: totalSize,
                    sizeFormatted: formatBytes(totalSize)
                }
            };
        }

        function formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // Public API
        return {
            // Basic operations
            setItem,
            getItem,
            getAllItems,
            deleteItem,
            clearStore,
            
            // Query operations
            queryItems,
            searchItems,
            
            // Batch operations
            batchOperation,
            
            // Maintenance
            cleanup,
            
            // Export/Import
            exportData,
            importData,
            
            // Statistics
            getStorageStats,
            
            // Utility
            isInitialized: () => isInitialized,
            getConfig: () => STORAGE_CONFIG
        };
    })();

    // Session Storage Helper
    Growth90.Data.SessionStorage = (() => {
        const prefix = 'growth90_session_';

        function setItem(key, value) {
            try {
                const data = {
                    value,
                    timestamp: Date.now()
                };
                sessionStorage.setItem(prefix + key, JSON.stringify(data));
                return true;
            } catch (error) {
                return false;
            }
        }

        function getItem(key) {
            try {
                const item = sessionStorage.getItem(prefix + key);
                if (!item) return null;
                
                const data = JSON.parse(item);
                return data.value;
            } catch (error) {
                return null;
            }
        }

        function removeItem(key) {
            try {
                sessionStorage.removeItem(prefix + key);
                return true;
            } catch (error) {
                return false;
            }
        }

        function clear() {
            try {
                const keys = [];
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        keys.push(key);
                    }
                }
                keys.forEach(key => sessionStorage.removeItem(key));
                return true;
            } catch (error) {
                return false;
            }
        }

        return { setItem, getItem, removeItem, clear };
    })();

    // Local Storage Helper
    Growth90.Data.LocalStorage = (() => {
        const prefix = 'growth90_local_';

        function setItem(key, value, expiresIn = null) {
            try {
                const data = {
                    value,
                    timestamp: Date.now(),
                    expiresAt: expiresIn ? Date.now() + expiresIn : null
                };
                localStorage.setItem(prefix + key, JSON.stringify(data));
                return true;
            } catch (error) {
                return false;
            }
        }

        function getItem(key) {
            try {
                const item = localStorage.getItem(prefix + key);
                if (!item) return null;
                
                const data = JSON.parse(item);
                
                // Check expiration
                if (data.expiresAt && Date.now() > data.expiresAt) {
                    localStorage.removeItem(prefix + key);
                    return null;
                }
                
                return data.value;
            } catch (error) {
                return null;
            }
        }

        function removeItem(key) {
            try {
                localStorage.removeItem(prefix + key);
                return true;
            } catch (error) {
                return false;
            }
        }

        function clear() {
            try {
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        keys.push(key);
                    }
                }
                keys.forEach(key => localStorage.removeItem(key));
                return true;
            } catch (error) {
                return false;
            }
        }

        return { setItem, getItem, removeItem, clear };
    })();

    // Cache management system
    Growth90.Data.Cache = (() => {
        const memoryCache = new Map();
        const maxMemoryCacheSize = 100; // Maximum number of items in memory cache

        // Validate if value is worth caching
        function isValidForCaching(value) {
            if (value === null || value === undefined || value === '') {
                return false;
            }
            
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            
            if (typeof value === 'object') {
                const keys = Object.keys(value);
                return keys.length > 0 && keys.some(key => {
                    const val = value[key];
                    return val !== null && val !== undefined && val !== '';
                });
            }
            
            return true;
        }

        async function set(key, value, ttl = 3600000) { // Default 1 hour TTL
            // Don't cache empty or meaningless values
            if (!isValidForCaching(value)) {
                return false;
            }
            
            const expiresAt = new Date(Date.now() + ttl).toISOString();
            
            // Store in memory cache
            memoryCache.set(key, { value, expiresAt });
            
            // Cleanup memory cache if too large
            if (memoryCache.size > maxMemoryCacheSize) {
                const firstKey = memoryCache.keys().next().value;
                memoryCache.delete(firstKey);
            }
            
            // Store in IndexedDB cache
            try {
                await Growth90.Data.Storage.setItem('contentCache', {
                    id: key,
                    type: 'cache',
                    value,
                    expiresAt
                });
            } catch (error) {
            }
        }

        async function get(key) {
            // Check memory cache first
            const memoryItem = memoryCache.get(key);
            if (memoryItem) {
                if (new Date(memoryItem.expiresAt) > new Date()) {
                    return memoryItem.value;
                } else {
                    memoryCache.delete(key);
                }
            }
            
            // Check IndexedDB cache
            try {
                const item = await Growth90.Data.Storage.getItem('contentCache', key);
                if (item && new Date(item.expiresAt) > new Date()) {
                    // Add back to memory cache
                    memoryCache.set(key, { value: item.value, expiresAt: item.expiresAt });
                    return item.value;
                } else if (item) {
                    // Expired, remove it
                    await Growth90.Data.Storage.deleteItem('contentCache', key);
                }
            } catch (error) {
            }
            
            return null;
        }

        async function remove(key) {
            memoryCache.delete(key);
            try {
                await Growth90.Data.Storage.deleteItem('contentCache', key);
            } catch (error) {
            }
        }

        function clear() {
            memoryCache.clear();
            return Growth90.Data.Storage.clearStore('contentCache');
        }

        return { set, get, remove, clear };
    })();

    // Initialize storage cleanup on app start
    Growth90.Core.EventBus.on('app:initialized', () => {
        // Clean up storage on app start
        Growth90.Data.Storage.cleanup().catch(error => {
        });

        // Set up periodic cleanup (every 24 hours)
        setInterval(() => {
            Growth90.Data.Storage.cleanup().catch(error => {
            });
        }, 24 * 60 * 60 * 1000);
    });

})(window.Growth90 = window.Growth90 || {
    Core: { EventBus: { on: () => {}, emit: () => {} } },
    Data: {}, UI: {}, Learning: {}, User: {}
});
