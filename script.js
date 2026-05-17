let resources = [];
let isAdmin = false;

const listContainer = document.getElementById('resources-list');
const tagsContainer = document.getElementById('tags-container');
const searchInput = document.getElementById('search-input');
const adminManagement = document.getElementById('admin-management');

let activeTags = new Set();
let searchQuery = '';

async function init() {
    checkAdminAccess();
    try {
        const response = await fetch('resources.json');
        resources = await response.json();
    } catch (e) {
        console.error("Failed to load resources:", e);
        resources = [];
    }
    
    if (tagsContainer) renderTags();
    if (listContainer) renderList();
    setupEventListeners();
}

function checkAdminAccess() {
    // Only show admin features if running locally (file:// or localhost)
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        isAdmin = true;
        if (adminManagement) {
            adminManagement.style.display = 'block';
        }
    }
}

function renderTags() {
    // Extract unique tags
    const allTags = new Set();
    resources.forEach(r => r.tags.forEach(tag => allTags.add(tag)));
    
    // Sort tags alphabetically
    const sortedTags = Array.from(allTags).sort();

    tagsContainer.innerHTML = '';
    sortedTags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'tag-btn';
        btn.textContent = tag;
        btn.dataset.tag = tag;
        
        btn.addEventListener('click', () => {
            if (activeTags.has(tag)) {
                activeTags.delete(tag);
                btn.classList.remove('active');
            } else {
                activeTags.add(tag);
                btn.classList.add('active');
            }
            renderList();
        });
        
        tagsContainer.appendChild(btn);
    });
}

function renderList() {
    listContainer.innerHTML = '';
    
    const filtered = resources.filter(resource => {
        // 1. Search Query Match
        const query = searchQuery.toLowerCase();
        const matchesSearch = resource.title.toLowerCase().includes(query);
        
        // 2. Tag Match (OR logic)
        let matchesTags = true;
        if (activeTags.size > 0) {
            matchesTags = resource.tags.some(tag => activeTags.has(tag));
        }

        return matchesSearch && matchesTags;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">No resources found matching your criteria.</p>';
        return;
    }

    filtered.forEach((resource, index) => {
        const item = document.createElement('article');
        item.className = 'list-item';
        item.id = `resource-${index}`;
        
        const tagsHtml = resource.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('');
        
        let adminHtml = '';
        let editContainerHtml = '';
        if (isAdmin) {
            // Encode tags array to pass to edit function
            const tagsStr = encodeURIComponent(JSON.stringify(resource.tags));
            adminHtml = `
                <div class="item-actions" style="margin-top: 0; align-items: center;">
                    <button class="icon-btn" onclick="startEdit(${index}, '${resource.url}', '${tagsStr}')" title="Edit Tags">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                    <button class="icon-btn delete" onclick="deleteResource('${resource.url}')" title="Delete">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
            editContainerHtml = `
                <div id="edit-container-${index}" style="display: none; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; width: 100%;">
                    <div class="tag-input-container" id="edit-tag-container-${index}">
                        <input type="text" id="edit-tag-input-${index}" placeholder="add tag..." autocomplete="off">
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="primary-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="saveEdit(${index}, '${resource.url}')">Save</button>
                        <button class="secondary-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="cancelEdit(${index})">Cancel</button>
                    </div>
                </div>
            `;
        }

        item.innerHTML = `
            <div class="item-title-row" style="justify-content: space-between;">
                <div style="display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap;">
                    <h2 class="item-title">
                        <a href="${resource.url}" target="_blank" rel="noopener noreferrer">${resource.title}</a>
                    </h2>
                    <div class="item-tags" id="tags-display-${index}">${tagsHtml}</div>
                </div>
                ${adminHtml}
            </div>
            ${editContainerHtml}
        `;
        
        listContainer.appendChild(item);
    });
}

function setupEventListeners() {
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderList();
        });
    }
}

// --- Admin CRUD Functions ---

window.editTagsData = {}; // Stores tags being edited

window.startEdit = function(index, url, tagsEncoded) {
    const tagsArr = JSON.parse(decodeURIComponent(tagsEncoded));
    
    // Hide display, show edit container
    document.getElementById(`tags-display-${index}`).style.display = 'none';
    document.getElementById(`edit-container-${index}`).style.display = 'flex';
    
    // Initialize tags data
    window.editTagsData[index] = [...tagsArr];
    
    const container = document.getElementById(`edit-tag-container-${index}`);
    const input = document.getElementById(`edit-tag-input-${index}`);
    
    // Function to render chips inline
    const renderEditTags = () => {
        const chips = container.querySelectorAll('.tag-chip');
        chips.forEach(c => c.remove());
        
        window.editTagsData[index].forEach((tag, tagIndex) => {
            const chip = document.createElement('div');
            chip.className = 'tag-chip';
            chip.innerHTML = `<span>${tag}</span><span class="tag-chip-remove" onclick="removeEditTag(${index}, ${tagIndex})">&times;</span>`;
            container.insertBefore(chip, input);
        });
    };
    
    renderEditTags();
    
    // Cleanup old listeners to avoid duplicates if edit clicked multiple times
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    newInput.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = newInput.value.trim().replace(/,/g, '').toLowerCase();
            if (val && !window.editTagsData[index].includes(val)) {
                window.editTagsData[index].push(val);
                newInput.value = '';
                renderEditTags();
            }
        } else if (e.key === 'Backspace' && newInput.value === '' && window.editTagsData[index].length > 0) {
            window.editTagsData[index].pop();
            renderEditTags();
        }
    });
    
    container.onclick = () => newInput.focus();
    newInput.focus();
};

window.removeEditTag = function(itemIndex, tagIndex) {
    window.editTagsData[itemIndex].splice(tagIndex, 1);
    
    // Re-render
    const container = document.getElementById(`edit-tag-container-${itemIndex}`);
    const input = document.getElementById(`edit-tag-input-${itemIndex}`);
    const chips = container.querySelectorAll('.tag-chip');
    chips.forEach(c => c.remove());
    
    window.editTagsData[itemIndex].forEach((tag, tIdx) => {
        const chip = document.createElement('div');
        chip.className = 'tag-chip';
        chip.innerHTML = `<span>${tag}</span><span class="tag-chip-remove" onclick="removeEditTag(${itemIndex}, ${tIdx})">&times;</span>`;
        container.insertBefore(chip, input);
    });
};

window.cancelEdit = function(index) {
    document.getElementById(`tags-display-${index}`).style.display = 'flex';
    document.getElementById(`edit-container-${index}`).style.display = 'none';
};

window.saveEdit = async function(index, url) {
    const newTags = window.editTagsData[index] || [];
    
    try {
        const response = await fetch('/api/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url, tags: newTags })
        });
        if (!response.ok) throw new Error('Failed to update');
        
        // Reload resources locally
        const res = await fetch('resources.json');
        resources = await res.json();
        
        renderTags();
        renderList();
    } catch (err) {
        alert('Failed to update: ' + err.message);
    }
};

window.deleteResource = async function(url) {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
        const response = await fetch('/api/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        if (!response.ok) throw new Error('Failed to delete');
        
        // Reload resources locally
        const res = await fetch('resources.json');
        resources = await res.json();
        
        renderTags();
        renderList();
    } catch (err) {
        alert('Failed to delete: ' + err.message);
    }
};

document.addEventListener('DOMContentLoaded', init);
