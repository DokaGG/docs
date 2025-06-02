// searchPDFs.js
import { samsungPDFs } from './samsung.js';
import { huaweiPDFs } from './huawei.js';
import { applePDFs } from './apple.js';

// Map brand names to their respective PDF arrays
const pdfs = {
    samsung: samsungPDFs,
    huawei: huaweiPDFs,
    apple: applePDFs,
};

// Debounce function to limit how often search executes during typing
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Display search results with enhanced UI
function displayResults(results, container) {
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="bi bi-file-earmark-x"></i>
                <h4>No schematics found</h4>
                <p>Try a different search term or brand</p>
            </div>
        `;
        return;
    }

    results.forEach(pdf => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="card-icon">
                <i class="bi bi-file-earmark-pdf"></i>
            </div>
            <div class="card-content">
                <h3 class="card-title">${pdf.name}</h3>
                <div class="card-meta">
                    <span class="file-size">${pdf.size || 'N/A'}</span>
                    <span class="page-count">${pdf.pages || 'N/A'} pages</span>
                </div>
            </div>
            <button class="view-btn" aria-label="View ${pdf.name}">
                <i class="bi bi-eye"></i>
            </button>
        `;

        const viewBtn = card.querySelector('.view-btn');
        viewBtn.addEventListener('click', () => loadPDF(pdf.file));

        // Make entire card clickable
        card.addEventListener('click', (e) => {
            if (!viewBtn.contains(e.target)) {
                loadPDF(pdf.file);
            }
        });

        container.appendChild(card);
    });
}

// Enhanced search function with fuzzy matching
function searchPDFs() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const brand = document.getElementById("brandSelect").value;
    const resultsContainer = document.getElementById("searchResults");
    
    // Show loading state
    resultsContainer.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Searching schematics...</p>
        </div>
    `;

    // Check if a brand is selected
    if (!brand) {
        resultsContainer.innerHTML = `
            <div class="select-brand-prompt">
                <i class="bi bi-phone"></i>
                <p>Please select a brand to search schematics</p>
            </div>
        `;
        return;
    }

    // Get the PDFs for the selected brand
    const brandPDFs = pdfs[brand];

    // If empty query, show some popular/recent schematics
    if (query === '') {
        const popularResults = brandPDFs.slice(0, 5);
        displayResults(popularResults, resultsContainer);
        return;
    }

    // Improved search algorithm with fuzzy matching
    const results = brandPDFs.filter(pdf => {
        const name = pdf.name.toLowerCase();
        
        // Exact match gets highest priority
        if (name === query) return true;
        
        // Contains match
        if (name.includes(query)) return true;
        
        // Fuzzy match - split query into parts
        const queryParts = query.split(/\s+/);
        return queryParts.every(part => name.includes(part));
    }).slice(0, 10); // Show more results than before

    // Add some artificial delay to show loading (remove in production)
    setTimeout(() => {
        displayResults(results, resultsContainer);
    }, 300);
}

// Function to load PDF in viewer with loading state
function loadPDF(pdfFile) {
    const viewer = document.getElementById("pdf-js-viewer");
    const viewerContainer = viewer.parentElement;
    
    // Show loading state
    viewerContainer.classList.add('loading');
    viewer.src = '';
    
    // Load the PDF after a brief delay to allow UI to update
    setTimeout(() => {
        viewer.src = `web/viewer.html?file=${encodeURIComponent(pdfFile)}`;
        
        // Hide loading state when PDF is loaded
        viewer.onload = () => {
            viewerContainer.classList.remove('loading');
        };
    }, 100);
    
    // Scroll to viewer
    viewer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Initialize search functionality
function initSearch() {
    const searchInput = document.getElementById("searchInput");
    const brandSelect = document.getElementById("brandSelect");
    
    // Debounced search to improve performance
    const debouncedSearch = debounce(searchPDFs, 300);
    
    // Event listeners
    searchInput.addEventListener('input', debouncedSearch);
    brandSelect.addEventListener('change', searchPDFs);
    
    // Form submission handler
    document.getElementById("searchForm").addEventListener("submit", (e) => {
        e.preventDefault();
        searchPDFs();
    });
    
    // Initial load - show some popular schematics
    searchPDFs();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSearch);