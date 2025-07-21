// Enhanced unsubscribe extractor with URL validation and cleaning
const unsubscribeKeywords = [
    'unsubscribe', 'opt-out', 'optout', 'remove', 'stop receiving', 'cancel subscription'
];

// Enhanced URL patterns for better extraction
const urlPatterns = {
    // Standard URL patterns
    standard: /https?:\/\/[^\s<>"']+/gi,
    
    // Common unsubscribe URL patterns
    unsubscribe: [
        /https?:\/\/[^\s<>"']*(?:unsubscribe|opt-?out|remove)[^\s<>"']*/gi,
        /https?:\/\/[^\s<>"']*(?:cancel|stop)[^\s<>"']*subscription[^\s<>"']*/gi,
        /https?:\/\/[^\s<>"']*preferences[^\s<>"']*/gi
    ]
};

// HTML Element patterns for better link extraction
const htmlPatterns = {
    // Link elements
    links: {
        anchor: /<a[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>.*?<\/a>/gi,
        button: /<button[^>]*onclick=["'][^"']*?(https?:\/\/[^"']+)[^>]*>.*?<\/button>/gi,
        form: /<form[^>]*action=["'](https?:\/\/[^"']+)["'][^>]*>.*?<\/form>/gi
    }
};

// Simple exclusion patterns
const excludePatterns = [
    // Image files
    '\\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$',
    
    // Video files
    '\\.(mp4|avi|mov|wmv|flv|webm|mkv)$',
    
    // Audio files
    '\\.(mp3|wav|flac|aac|ogg|wma)$',
    
    // Document files
    '\\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)$',
    
    // Archive files
    '\\.(zip|rar|7z|tar|gz)$'
];

class UnsubscribeLinkExtractor {
    constructor() {
        this.maxUrlLength = 4096; // CHANGED: Increased from 2048 to 4096
    }

    // Clean URL by decoding HTML entities and fixing common issues
    cleanUrl(url, baseUrl = null) {
        if (!url) return url;
        
        // Enhanced HTML entity decoding
        let cleanedUrl = url
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .replace(/&#x60;/g, '`')
            .replace(/&#x3D;/g, '=')
            .replace(/&#x26;/g, '&')
            // ADDED: More common HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&copy;/g, '©')
            .replace(/&reg;/g, '®')
            .replace(/&trade;/g, '™')
            .replace(/&mdash;/g, '—')
            .replace(/&ndash;/g, '–')
            .replace(/&hellip;/g, '…');
        
        // Remove trailing quotes or brackets
        cleanedUrl = cleanedUrl.replace(/["')\]}>]+$/, '');
        
        // Fix double encoding
        if (cleanedUrl.includes('%25')) {
            try {
                cleanedUrl = decodeURIComponent(cleanedUrl);
            } catch (e) {
                // If decode fails, keep original
            }
        }
        
        // ADDED: URL repair logic
        cleanedUrl = this.repairUrl(cleanedUrl, baseUrl);
        
        return cleanedUrl;
    }

    // Add this method to the class
    repairUrl(url, baseUrl = null) {
        if (!url) return url;
        
        let repairedUrl = url;
        
        // Fix missing protocol
        if (!repairedUrl.match(/^https?:\/\//)) {
            repairedUrl = 'https://' + repairedUrl;
        }
        
        // Handle relative URLs if base URL is provided
        if (repairedUrl.startsWith('/') && baseUrl) {
            try {
                const baseUrlObj = new URL(baseUrl);
                repairedUrl = baseUrlObj.origin + repairedUrl;
            } catch (e) {
                // If base URL is invalid, keep relative URL
            }
        }
        
        // Fix common encoding issues
        try {
            // Try to decode if it looks encoded
            if (repairedUrl.includes('%') && !repairedUrl.includes('%25')) {
                const decoded = decodeURIComponent(repairedUrl);
                if (decoded !== repairedUrl) {
                    repairedUrl = decoded;
                }
            }
        } catch (e) {
            // If decode fails, keep original
        }
        
        return repairedUrl;
    }

    extractFromHtml(html, language = 'en', context = {}) {
        const urlScores = new Map();
        
        if (!html || html.length > 1024 * 1024) {
            console.log('⚠️ HTML too large or empty');
            return urlScores;
        }

        // Method 1: Extract from HTML elements (most reliable)
        this.extractFromHtmlElements(html, urlScores, context);
        
        // Method 2: Extract URLs near keywords
        this.extractFromKeywords(html, urlScores, context);
        
        // Method 3: Extract using unsubscribe patterns
        this.extractFromPatterns(html, urlScores, context);

        console.log(` Found ${urlScores.size} potential unsubscribe links from HTML`);
        return urlScores;
    }

    extractFromHtmlElements(html, urlScores, context = {}) {
        // Extract from anchor tags
        let match;
        const anchorPattern = htmlPatterns.links.anchor;
        while ((match = anchorPattern.exec(html)) !== null) {
            const rawUrl = match[1];
            const linkText = match[0];
            const url = this.cleanUrl(rawUrl);
            
            if (url && this.isValidUrl(url)) {
                const score = this.calculateScore(url, 'html_element', 'html', context);
                
                // Check if link text contains unsubscribe keywords
                const hasKeyword = unsubscribeKeywords.some(keyword => 
                    linkText.toLowerCase().includes(keyword)
                );
                
                // Much higher bonus for link text with unsubscribe keywords
                const finalScore = hasKeyword ? score + 80 : score;
                
                const currentScore = urlScores.get(url) || 0;
                urlScores.set(url, Math.max(currentScore, finalScore));
            }
        }

        // Extract from button tags
        const buttonPattern = htmlPatterns.links.button;
        while ((match = buttonPattern.exec(html)) !== null) {
            const rawUrl = match[1];
            const url = this.cleanUrl(rawUrl);
            
            if (url && this.isValidUrl(url)) {
                const score = this.calculateScore(url, 'html_element', 'html', context);
                const currentScore = urlScores.get(url) || 0;
                urlScores.set(url, Math.max(currentScore, score));
            }
        }

        // Extract from form tags
        const formPattern = htmlPatterns.links.form;
        while ((match = formPattern.exec(html)) !== null) {
            const rawUrl = match[1];
            const url = this.cleanUrl(rawUrl);
            
            if (url && this.isValidUrl(url)) {
                const score = this.calculateScore(url, 'html_element', 'html', context) + 60; // Bonus for form action
                const currentScore = urlScores.get(url) || 0;
                urlScores.set(url, Math.max(currentScore, score));
            }
        }
    }

    extractFromKeywords(html, urlScores, context = {}) {
        // Extract URLs near unsubscribe keywords
        for (const keyword of unsubscribeKeywords) {
            console.log(`🔍 Searching for keyword: ${keyword}`);
            
            // FIXED: Use a more comprehensive URL pattern that includes query parameters
            const pattern = new RegExp(
                `(?:${keyword}.*?)(https?:\/\/[^\s<>"']+(?:[&?][^\s<>"']*)*)|` +  // URL after keyword with query params
                `(https?:\/\/[^\s<>"']+(?:[&?][^\s<>"']*)*).*?${keyword}`,       // URL before keyword with query params
                'gi'
            );

            let match;
            while ((match = pattern.exec(html)) !== null) {
                const rawUrl = match[1] || match[2];
                console.log(`🔗 Raw URL found: ${rawUrl}`);
                console.log(`🔗 Full match: ${match[0]}`);
                
                const url = this.cleanUrl(rawUrl);
                console.log(`🔗 Cleaned URL: ${url}`);
                
                if (url && this.isValidUrl(url)) {
                    // REDUCED BONUS: Lower the keyword proximity bonus to avoid overriding HTML elements
                    const score = this.calculateScore(url, keyword, 'html', context) + 20; // CHANGED: from +50 to +20
                    const currentScore = urlScores.get(url) || 0;
                    urlScores.set(url, Math.max(currentScore, score));
                    console.log(`✅ Valid URL added with score: ${score}`);
                } else {
                    console.log(`❌ Invalid URL: ${url}`);
                }
            }
        }
    }

    extractFromPatterns(html, urlScores, context = {}) {
        // Extract using unsubscribe URL patterns
        for (const pattern of urlPatterns.unsubscribe) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const rawUrl = match[0];
                const url = this.cleanUrl(rawUrl);
                
                if (url && this.isValidUrl(url)) {
                    const score = this.calculateScore(url, 'pattern', 'html', context) + 30; // Bonus for pattern match
                    const currentScore = urlScores.get(url) || 0;
                    urlScores.set(url, Math.max(currentScore, score));
                }
            }
        }
    }

    extractFromText(text, language = 'en', context = {}) {
        const urlScores = new Map();
        
        if (!text || text.length > 1024 * 1024) {
            console.log('⚠️ Text too large or empty');
            return urlScores;
        }

        // Extract URLs near unsubscribe keywords
        for (const keyword of unsubscribeKeywords) {
            // FIXED: Use a more comprehensive URL pattern that includes query parameters
            const pattern = new RegExp(
                `(?:${keyword}.*?)(https?:\/\/[^\s<>"']+(?:[&?][^\s<>"']*)*)|` +  // URL after keyword with query params
                `(https?:\/\/[^\s<>"']+(?:[&?][^\s<>"']*)*).*?${keyword}`,       // URL before keyword with query params
                'gi'
            );

            let match;
            while ((match = pattern.exec(text)) !== null) {
                const rawUrl = match[1] || match[2];
                const url = this.cleanUrl(rawUrl);
                
                if (url && this.isValidUrl(url)) {
                    const score = this.calculateScore(url, keyword, 'text', context);
                    const currentScore = urlScores.get(url) || 0;
                    urlScores.set(url, Math.max(currentScore, score));
                }
            }
        }

        console.log(` Found ${urlScores.size} potential unsubscribe links from text`);
        return urlScores;
    }

    calculateScore(url, keyword, source, context = {}) {
        let score = 0;
        const bonusesGiven = new Set(); // Track bonuses to prevent double-counting
        
        try {
            const urlObj = new URL(url);
            const urlPath = urlObj.pathname.toLowerCase();
            const urlHost = urlObj.hostname.toLowerCase();
            
            // Base score for finding URL
            score += 20;
            
            // Bonus for HTML element extraction (most reliable)
            if (source === 'html' && keyword === 'html_element') {
                score += 30;
            }
            
            // Maximum bonus for header source (most reliable)
            if (source === 'header') {
                score += 100;
            }
            
            // Bonus for HTML source
            if (source === 'html') {
                score += 10;
            }
            
            // FIXED: Prevent double-counting with pattern matching
            if (urlPath.includes('unsubscribe') && !bonusesGiven.has('unsubscribe_path')) {
                score += 70;
                bonusesGiven.add('unsubscribe_path');
            }
            if ((urlPath.includes('opt-out') || urlPath.includes('optout')) && !bonusesGiven.has('optout_path')) {
                score += 60;
                bonusesGiven.add('optout_path');
            }
            if ((urlPath.includes('preferences') || urlPath.includes('manage')) && !bonusesGiven.has('preferences_path')) {
                score += 30;
                bonusesGiven.add('preferences_path');
            }
            if ((urlPath.includes('remove') || urlPath.includes('cancel')) && !bonusesGiven.has('remove_path')) {
                score += 40;
                bonusesGiven.add('remove_path');
            }
            
            // Maximum bonus for exact unsubscribe patterns
            if ((urlPath === '/r' || urlPath === '/unsubscribe' || urlPath === '/opt-out') && !bonusesGiven.has('exact_pattern')) {
                score += 70;
                bonusesGiven.add('exact_pattern');
            }
            
            // Bonus for encoded parameters (common in unsubscribe links)
            const hasEncodedParams = url.includes('%') || url.includes('&amp;') || url.includes('&lt;') || url.includes('&gt;');
            if (hasEncodedParams) {
                score += 15;
            }
            
            // Bonus for specific parameter patterns
            if (urlObj.searchParams.has('v') || urlObj.searchParams.has('a') || urlObj.searchParams.has('token')) {
                score += 10;
            }
            
            // Enhanced penalties for very long URLs (likely expired or malformed)
            if (url.length > 500) {
                score -= 50; // Increased penalty from -30 to -50
            } else if (url.length > 300) {
                score -= 25; // Increased penalty from -15 to -25
            }
            
            // Enhanced penalties for URLs with many parameters (likely expired)
            const paramCount = urlObj.searchParams.size;
            if (paramCount > 15) {
                score -= 40; // Increased penalty from -25 to -40
            } else if (paramCount > 10) {
                score -= 20; // Increased penalty from -10 to -20
            }
            
            // Bonus for cleaner, shorter URLs
            if (url.length < 200) {
                score += 15;
            }
            if (url.length < 150) {
                score += 10;
            }
            
            // Small penalty for article/news URLs
            if (urlHost.includes('news') || urlPath.includes('article') || urlPath.includes('story')) {
                score -= 10;
            }
            
            // ADDED: Context-aware bonuses
            // Bonus for matching sender domain
            if (context.senderDomain && urlHost.includes(context.senderDomain)) {
                score += 25;
            }
            
            // Bonus for footer position (if we can detect it)
            if (context.isFooterLink) {
                score += 20;
            }
            
            // Bonus for multiple identical links (higher confidence)
            if (context.linkFrequency && context.linkFrequency > 1) {
                score += 15;
            }
            
            // Ensure minimum score of 0
            score = Math.max(0, score);
            
            console.log(`🔗 Score for ${url.substring(0, 80)}...: ${score} (keyword: ${keyword}, source: ${source})`);
            
        } catch (error) {
            console.log(`❌ Error calculating score for ${url.substring(0, 50)}...:`, error.message);
        }
        
        return score;
    }

    isValidUrl(url) {
        try {
            if (!url || url.length > this.maxUrlLength) {
                console.log(`❌ URL too long (${url.length} chars): ${url.substring(0, 50)}...`);
                return false;
            }

            const urlObj = new URL(url);
            
            // Check if URL is excluded
            for (const pattern of excludePatterns) {
                if (new RegExp(pattern, 'i').test(url)) {
                    console.log(`❌ Excluded URL (${pattern}): ${url.substring(0, 50)}...`);
                    return false;
                }
            }

            // ADDED: Better validation for tracking URLs
            if (url.length > 500) {
                console.log(`⚠️ Very long URL detected (${url.length} chars): ${url.substring(0, 80)}...`);
                // Don't reject long URLs, just log them
            }

            return true;
        } catch (error) {
            console.log(`❌ Invalid URL: ${url.substring(0, 50)}...`);
            return false;
        }
    }

    extractFromHeaders(headers) {
        const listUnsubscribe = headers['List-Unsubscribe'] || headers['list-unsubscribe'];
        if (listUnsubscribe) {
            console.log('📧 Found List-Unsubscribe header:', listUnsubscribe);
            const match = listUnsubscribe.match(/<(https?:\/\/[^>]+)>/);
            if (match) {
                const rawUrl = match[1];
                const url = this.cleanUrl(rawUrl);
                
                if (this.isValidUrl(url)) {
                    const score = this.calculateScore(url, 'header', 'header', {});
                    console.log('✅ Extracted from header:', url.substring(0, 80) + '...', 'Score:', score);
                    return { url, score };
                }
            }
        }
        return null;
    }

    // Add context parameter to extract method
    extract(headers, htmlBody, plainBody, language = 'en', context = {}) {
        console.log('🔍 Starting enhanced unsubscribe link extraction...');
        
        const allUrlScores = new Map();
        
        // 1. Check headers first (most reliable)
        const headerResult = this.extractFromHeaders(headers);
        if (headerResult) {
            allUrlScores.set(headerResult.url, headerResult.score);
        }

        // 2. Check HTML body with enhanced extraction
        if (htmlBody) {
            const htmlScores = this.extractFromHtml(htmlBody, language, context);
            for (const [url, score] of htmlScores) {
                const currentScore = allUrlScores.get(url) || 0;
                allUrlScores.set(url, Math.max(currentScore, score));
            }
        }

        // 3. Check plain text body
        if (plainBody) {
            const textScores = this.extractFromText(plainBody, language, context);
            for (const [url, score] of textScores) {
                const currentScore = allUrlScores.get(url) || 0;
                allUrlScores.set(url, Math.max(currentScore, score));
            }
        }

        // Find the URL with the highest score
        let bestUrl = null;
        let bestScore = 0;
        
        for (const [url, score] of allUrlScores) {
            console.log(` Final score for ${url.substring(0, 80)}...: ${score}`);
            if (score > bestScore) {
                bestScore = score;
                bestUrl = url;
            }
        }

        if (bestUrl) {
            console.log(`🏆 Best unsubscribe link: ${bestUrl.substring(0, 80)}... (Score: ${bestScore})`);
            return bestUrl;
        }

        console.log('❌ No unsubscribe link found');
        return null;
    }
}

// Export the extractor
const extractor = new UnsubscribeLinkExtractor();

// Update the exported function to accept context
function extractUnsubscribeLink(headers, htmlBody, plainBody, language = 'en', context = {}) {
    return extractor.extract(headers, htmlBody, plainBody, language, context);
}

module.exports = { extractUnsubscribeLink }; 