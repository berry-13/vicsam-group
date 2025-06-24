#!/usr/bin/env node

/**
 * Test specifico per ambiente Codespaces
 * Verifica che l'API funzioni correttamente con i proxy e gli URL relativi
 */

const axios = require('axios');

console.log('🌐 ===== TEST CODESPACES ENVIRONMENT =====');

// Configurazione per test in Codespaces
const CLIENT_URL = 'http://localhost:5173';
const API_DIRECT_URL = 'http://localhost:3000';

async function testCodespacesEnvironment() {
    console.log('🔍 Verifica ambiente Codespaces...\n');
    
    // Test 1: API diretta
    console.log('1️⃣ Test API diretta (backend)...');
    try {
        const response = await axios.get(`${API_DIRECT_URL}/api/auth/debug`);
        console.log('✅ API diretta funziona!');
        console.log('📋 Backend URL:', API_DIRECT_URL);
    } catch (error) {
        console.log('❌ API diretta fallita:', error.message);
        return false;
    }
    
    // Test 2: Proxy tramite Vite
    console.log('\n2️⃣ Test proxy tramite Vite...');
    try {
        const response = await axios.get(`${CLIENT_URL}/api/auth/debug`);
        console.log('✅ Proxy Vite funziona!');
        console.log('📋 Client URL:', CLIENT_URL);
    } catch (error) {
        console.log('❌ Proxy Vite fallito:', error.message);
        return false;
    }
    
    // Test 3: Login tramite proxy
    console.log('\n3️⃣ Test login tramite proxy...');
    try {
        const loginResponse = await axios.post(`${CLIENT_URL}/api/auth/login`, {
            password: 'password-non-sicura'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login tramite proxy funziona!');
            console.log('🎫 Token ottenuto:', loginResponse.data.data.bearerToken ? 'SÌ' : 'NO');
            
            // Test 4: Verifica token tramite proxy
            console.log('\n4️⃣ Test verifica token tramite proxy...');
            try {
                const verifyResponse = await axios.get(`${CLIENT_URL}/api/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${loginResponse.data.data.bearerToken}`
                    }
                });
                
                if (verifyResponse.data.success) {
                    console.log('✅ Verifica token tramite proxy funziona!');
                    return true;
                } else {
                    console.log('❌ Verifica token fallita:', verifyResponse.data.message);
                    return false;
                }
            } catch (error) {
                console.log('❌ Verifica token tramite proxy fallita:', error.message);
                return false;
            }
        } else {
            console.log('❌ Login tramite proxy fallito:', loginResponse.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Login tramite proxy fallito:', error.message);
        return false;
    }
}

// Test delle configurazioni URL
function testUrlConfigurations() {
    console.log('\n🔧 ===== TEST CONFIGURAZIONI URL =====');
    
    // Simula diverse configurazioni
    const configs = [
        {
            name: 'Sviluppo locale',
            hostname: 'localhost',
            protocol: 'http:',
            port: '5173'
        },
        {
            name: 'Codespaces',
            hostname: 'shiny-space-waddle-jgpq7w5wj9vc5qx5-5173.preview.app.github.dev',
            protocol: 'https:',
            port: '443'
        },
        {
            name: 'Gitpod',
            hostname: '5173-username-workspace-abc123.ws-eu45.gitpod.io',
            protocol: 'https:',
            port: '443'
        }
    ];
    
    configs.forEach(config => {
        console.log(`\n📋 ${config.name}:`);
        console.log(`  - Hostname: ${config.hostname}`);
        console.log(`  - Protocol: ${config.protocol}`);
        console.log(`  - Port: ${config.port}`);
        
        const isCodespaces = config.hostname.includes('github.dev') || 
                           config.hostname.includes('gitpod.io');
        const isHTTPS = config.protocol === 'https:';
        
        let recommendedBaseUrl = '/api';
        if (!isCodespaces && !isHTTPS) {
            recommendedBaseUrl = 'http://localhost:3000/api';
        }
        
        console.log(`  - Is Codespaces: ${isCodespaces}`);
        console.log(`  - Is HTTPS: ${isHTTPS}`);
        console.log(`  - Recommended base URL: ${recommendedBaseUrl}`);
    });
}

// Verifica configurazione corrente
function checkCurrentEnvironment() {
    console.log('\n🔍 ===== ENVIRONMENT DETECTION =====');
    
    // Simula le condizioni che il browser vedrebbe
    const mockWindow = {
        location: {
            hostname: process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'localhost',
            protocol: process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ? 'https:' : 'http:'
        }
    };
    
    console.log('Current environment simulation:');
    console.log('  - Hostname:', mockWindow.location.hostname);
    console.log('  - Protocol:', mockWindow.location.protocol);
    console.log('  - CODESPACES env:', process.env.CODESPACES || 'not set');
    console.log('  - GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:', process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'not set');
    
    const isCodespaces = mockWindow.location.hostname.includes('github.dev') || 
                        mockWindow.location.hostname.includes('gitpod.io') ||
                        process.env.CODESPACES === 'true';
    
    console.log('  - Detected as Codespaces:', isCodespaces);
    console.log('  - Recommended API strategy:', isCodespaces ? 'Relative URLs with proxy' : 'Direct URLs');
}

// Esegui tutti i test
async function runAllTests() {
    checkCurrentEnvironment();
    testUrlConfigurations();
    
    console.log('\n🧪 ===== FUNCTIONAL TESTS =====');
    const success = await testCodespacesEnvironment();
    
    console.log('\n🎯 ===== RISULTATO FINALE =====');
    if (success) {
        console.log('✅ Tutti i test sono passati!');
        console.log('🎉 L\'ambiente Codespaces è configurato correttamente.');
    } else {
        console.log('❌ Alcuni test sono falliti.');
        console.log('🔧 Controlla la configurazione del proxy e del server.');
    }
}

runAllTests().catch(console.error);
