
// Supabase Configuration
const SUPABASE_URL = 'https://awjntdtvmhgacexuhwvy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3am50ZHR2bWhnYWNleHVod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MzczNjIsImV4cCI6MjA3NjMxMzM2Mn0.ZfW2BORLTZO4a9bHfFzsMHUnR1VCy9ujptPDxC2tZ_0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const map = L.map('map').setView([8.6337, 126.0936], 18);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM', maxZoom: 22 }).addTo(map);

let currentMarker = null, selectedCoords = null, locations = [], idCounter = 1, locationMethod = 'map';
let highlightedPaths = [], allPathLayers = {};
let uploadedImages = [];
let editingLocationId = null;

const typeColors = { room: '#3C9AFB', office: '#0C1635', department: '#9B59B6', facility: '#F39C12', entrance: '#27AE60' };

// Load existing locations from Supabase on page load
async function loadLocationsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('campus_locations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading locations:', error);
            return;
        }
        
        if (data && data.length > 0) {
           locations = data.map(loc => {
    return {
        id: loc.id,
        name: loc.name,
        building: loc.building,
        connected_path: Array.isArray(loc.connected_path) ? loc.connected_path : [loc.connected_path],
        type: loc.type,
        floor: loc.floor,
        category: loc.category,
        access_type: loc.access_type,
        dual_pathways: loc.dual_pathways || false,
        description: loc.description || '',
        images: loc.image_urls || [],
        coordinates: [loc.longitude, loc.latitude]
    };
});

            
            // Display all loaded locations
            locations.forEach(loc => {
                addLocationToList(loc);
                addPermanentMarker(loc);
            });
            
            console.log(`Loaded ${locations.length} locations from database`);
        }
    } catch (err) {
        console.error('Failed to load locations:', err);
    }
}

// Call loadLocationsFromSupabase after pathways are initialized
setTimeout(() => {
    loadLocationsFromSupabase();
}, 500);
const PATHWAYS = {
  north_main_pathway: {
    name: 'North Main',
    coordinates: [
      [126.09357428189492, 8.63319749028041],
      [126.09356214979526, 8.633253747451871],
      [126.09355572349156, 8.633296348512722],
      [126.0935394404083, 8.633400048264056],
      [126.09353139678105, 8.633448530659937],
      [126.09352802663678, 8.6334718543601],
      [126.09350032978199, 8.633647360207476],
      [126.09369096521928, 8.633670651976637],
      [126.09382628009621, 8.633688308638696],
      [126.09381049098332, 8.633986221753304],
      [126.09380146501734, 8.634186633262068],
      [126.09379470187042, 8.634284134867912],
      [126.09364744841791, 8.63427337039592],
      [126.0935001949654, 8.63426260592393],
      [126.09348687659612, 8.63460309742712],
      [126.09340353375882, 8.63459866983851]
    ]
  },

  canteen_path: {
    name: 'Canteen',
    coordinates: [
      [126.09355572349156, 8.633296348512722],
      [126.0934298160375, 8.633291120234912],
      [126.09340281504166, 8.633289869683537],
      [126.09340332681319, 8.633262547167739],
      [126.09338507364072, 8.63326086059395],
      [126.09331981336783, 8.63323326284548]
    ]
  },

  admin_path: {
    name: 'Administration',
    coordinates: [
      [126.09356214979526, 8.633253747451871],
      [126.09365672453441, 8.633267981823364],
      [126.09370167554721, 8.633275079982354]
    ]
  },

  admin_registrar_path: {
    name: 'Admin-Registrar',
    coordinates: [
      [126.09365672453441, 8.633267981823364],
      [126.0936463293728, 8.633336410982622],
      [126.09363333029262, 8.633417044422359],
      [126.0937400702191, 8.633453585956957]
    ]
  },

  main_registrar_connector: {
    name: 'Main-Registrar Bridge',
    coordinates: [
      [126.0935394404083, 8.633400048264056],
      [126.09363333029262, 8.633417044422359]
    ]
  },

  registrar_direct_path: {
    name: 'Registrar Direct',
    coordinates: [
      [126.0937400702191, 8.633453585956957],
      [126.09369096521928, 8.633670651976637]
    ]
  },

  commission_path: {
    name: 'Commission',
    coordinates: [
      [126.09357426967426, 8.63319764838188],
      [126.09353601709819, 8.6331959273041]
    ]
  },

  hm_building_path: {
    name: 'HM via Canteen',
    coordinates: [
      [126.0934298160375, 8.633291120234912],
      [126.09342771423962, 8.63334297704371],
      [126.0933989278463, 8.633343514028624]
    ]
  },

  hm_to_main_path: {
    name: 'HM to Main',
    coordinates: [
      [126.09339878208465, 8.633430892934001],
      [126.09353139678105, 8.633448530659937]
    ]
  },

  auditorium_path: {   // 🔥 fixed lowercase
    name: 'Auditorium Path',
    coordinates: [
      [126.09350032978199, 8.633647360207476],
      [126.09346533962781, 8.633676413425832],
      [126.09341325039117, 8.633688892800848],
      [126.09327555493164, 8.633706981217863],
      [126.09319287218536, 8.63376075885068],
      [126.09289119840713, 8.63411814156207]
    ]
  },

  south_extension: {
    name: 'South Extension',
    coordinates: [
      [126.09346533962781, 8.633676413425832],
      [126.09341985514288, 8.63389379950003],
      [126.0934118908905, 8.63401462002042],
      [126.09341030649549, 8.634138594319502],
      [126.09340353375882, 8.63459866983851]
    ]
  },

  main_entrance: {
    name: 'Main Entrance',
    coordinates: [
      [126.09365181388404, 8.633154772476885],
      [126.09357428189492, 8.63319749028041]
    ]
  }
};

function generatePathDropdownOptions() {
    const groups = {
        "Main Pathways": [],
        "Building Paths": [],
        "Connectors": [],
        "Entrances": []
    };

   const mapping = {
    north_main_pathway: "Main Pathways",

    canteen_path: "Building Paths",
    admin_path: "Building Paths",
    admin_registrar_path: "Building Paths",
    commission_path: "Building Paths",
    hm_building_path: "Building Paths",
    hm_to_main_path: "Building Paths",
    auditorium_path: "Building Paths", // lowercase fixed

    main_registrar_connector: "Connectors",
    registrar_direct_path: "Connectors",
    south_extension: "Connectors",

    main_entrance: "Entrances"
};


    Object.keys(PATHWAYS).forEach(id => {
        const group = mapping[id];
        if (group) {
            groups[group].push(`<option value="${id}">${PATHWAYS[id].name}</option>`);
        }
    });

    const html = `
        <option value="">Select Path</option>
        <optgroup label="Main Pathways">${groups["Main Pathways"].join('')}</optgroup>
        <optgroup label="Building Paths">${groups["Building Paths"].join('')}</optgroup>
        <optgroup label="Connectors">${groups["Connectors"].join('')}</optgroup>
        <optgroup label="Entrances">${groups["Entrances"].join('')}</optgroup>
    `;

    document.querySelectorAll('#connectedPath, #connectedPath2, #connectedPath3, #connectedPath4')
        .forEach(el => el.innerHTML = html);
}

generatePathDropdownOptions();



// Image compression function
function compressImage(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    const reader2 = new FileReader();
                    reader2.onload = (e2) => resolve(e2.target.result);
                    reader2.onerror = reject;
                    reader2.readAsDataURL(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    const remainingSlots = 4 - uploadedImages.length;
    
    if (files.length > remainingSlots) {
        alert(`You can only upload ${remainingSlots} more image(s). Maximum is 4 images.`);
        return;
    }
    
    for (const file of files) {
        if (uploadedImages.length >= 4) break;
        
        const compressed = await compressImage(file, 600, 0.6);
        uploadedImages.push(compressed);
    }
    
    updateImagePreview();
    event.target.value = '';
}

function updateImagePreview() {
    const preview = document.getElementById('imagePreview');
    const count = document.getElementById('imageCount');
    
    count.textContent = uploadedImages.length;
    preview.innerHTML = '';
    
    uploadedImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.innerHTML = `
            <img src="${img}" alt="Preview ${index + 1}">
            <button class="image-remove-btn" onclick="removeImage(${index})">×</button>
        `;
        preview.appendChild(div);
    });
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImagePreview();
}

function initializePathways() {
    Object.keys(PATHWAYS).forEach(id => {
        const p = PATHWAYS[id], latLngs = p.coordinates.map(c => [c[1], c[0]]);
        const layer = L.polyline(latLngs, { color: '#94a3b8', weight: 3, opacity: 0.5, dashArray: '5,5' }).addTo(map);
        layer.bindTooltip(p.name, { sticky: true });
        allPathLayers[id] = layer;
    });
}

function highlightPaths(pathIds) {
    // Reset all paths
    Object.keys(allPathLayers).forEach(id => {
        allPathLayers[id].setStyle({
            color: '#94a3b8',
            weight: 3,
            opacity: 0.5,
            dashArray: '5,5'
        });
    });

    // Remove old glow layers
    highlightedPaths.forEach(layer => map.removeLayer(layer));
    highlightedPaths = [];

    if (!pathIds || pathIds.length === 0) return;

    // Highlight each selected path
    pathIds.forEach(pathId => {
        if (!PATHWAYS[pathId]) return;

        const coords = PATHWAYS[pathId].coordinates.map(c => [c[1], c[0]]);

        // Highlight main line
        allPathLayers[pathId].setStyle({
            color: '#FFD523',   // yellow
            weight: 6,
            opacity: 1,
            dashArray: null
        });
        allPathLayers[pathId].bringToFront();

        // Add glow effect
        const glow = L.polyline(coords, {
            color: '#FF6B6B',
            weight: 12,
            opacity: 0.35
        }).addTo(map);

        highlightedPaths.push(glow);
    });

    // Fit bounds for all selected paths
    const allCoords = pathIds.flatMap(id =>
        PATHWAYS[id] ? PATHWAYS[id].coordinates.map(c => [c[1], c[0]]) : []
    );

    if (allCoords.length) {
        map.fitBounds(allCoords, { padding: [50, 50] });
    }
}


initializePathways();
function updateRouteFields() {
    const routeCount = parseInt(document.getElementById('routeCount').value);
    const secondPathGroup = document.getElementById('secondPathGroup');
    const thirdPathGroup = document.getElementById('thirdPathGroup');
    const fourthPathGroup = document.getElementById('fourthPathGroup');
    const connectedPath2 = document.getElementById('connectedPath2');
    const connectedPath3 = document.getElementById('connectedPath3');
    const connectedPath4 = document.getElementById('connectedPath4');
    
    // Show/hide fields based on route count
    if (routeCount >= 2) {
        secondPathGroup.style.display = 'block';
        connectedPath2.required = true;
    } else {
        secondPathGroup.style.display = 'none';
        connectedPath2.required = false;
        connectedPath2.value = '';
    }
    
    if (routeCount >= 3) {
        thirdPathGroup.style.display = 'block';
        connectedPath3.required = true;
    } else {
        thirdPathGroup.style.display = 'none';
        connectedPath3.required = false;
        connectedPath3.value = '';
    }
    
    if (routeCount >= 4) {
        fourthPathGroup.style.display = 'block';
        connectedPath4.required = true;
    } else {
        fourthPathGroup.style.display = 'none';
        connectedPath4.required = false;
        connectedPath4.value = '';
    }
    
    // Update path highlighting and submit button
    updatePathHighlighting();
    updateSubmitButton();
}
function updatePathHighlighting() {
    const routeCount = parseInt(document.getElementById('routeCount').value);
    const path1 = document.getElementById('connectedPath').value;
    const path2 = document.getElementById('connectedPath2').value;
    const path3 = document.getElementById('connectedPath3').value;
    const path4 = document.getElementById('connectedPath4').value;
    
    const paths = [path1];
    if (routeCount >= 2 && path2) paths.push(path2);
    if (routeCount >= 3 && path3) paths.push(path3);
    if (routeCount >= 4 && path4) paths.push(path4);
    
    const validPaths = paths.filter(p => p !== '');
    if (validPaths.length > 0) {
        highlightPaths(validPaths);
    } else {
        highlightPaths([]);
    }
}


document.getElementById('connectedPath').addEventListener('change', function() {
    updatePathHighlighting();
    updateSubmitButton();
});

document.getElementById('connectedPath2').addEventListener('change', function() {
    updatePathHighlighting();
    updateSubmitButton();
});

document.getElementById('connectedPath3').addEventListener('change', function() {
    updatePathHighlighting();
    updateSubmitButton();
});

document.getElementById('connectedPath4').addEventListener('change', function() {
    updatePathHighlighting();
    updateSubmitButton();
});

function setLocationMethod(m) {
    locationMethod = m;
    document.getElementById('mapBtn').classList.toggle('active', m === 'map');
    document.getElementById('locationBtn').classList.toggle('active', m === 'location');
    if (m === 'location') useLocation();
    else { if (currentMarker) { map.removeLayer(currentMarker); currentMarker = null; } selectedCoords = null; document.getElementById('latDisplay').textContent = 'Click map'; document.getElementById('lngDisplay').textContent = 'or use Location'; updateSubmitButton(); }
}

function useLocation() {
    const btn = document.getElementById('locationBtn'); btn.textContent = '📍...';
    if (!navigator.geolocation) { alert('Location not available'); btn.textContent = '📍 Location'; return; }
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng } = pos.coords; selectedCoords = { lat, lng };
        if (currentMarker) map.removeLayer(currentMarker);
        currentMarker = L.marker([lat, lng], { icon: L.divIcon({ html: '<div style="background:linear-gradient(135deg,#FFD523,#FF6B6B);width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>', iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(map);
        map.setView([lat, lng], 19);
        document.getElementById('latDisplay').textContent = lat.toFixed(7);
        document.getElementById('lngDisplay').textContent = lng.toFixed(7);
        btn.textContent = '📍 ✓'; updateSubmitButton();
    }, () => { alert('Location failed'); btn.textContent = '📍 Location'; }, { enableHighAccuracy: true, timeout: 10000 });
}

map.on('click', e => {
    if (locationMethod !== 'map') return;
    const { lat, lng } = e.latlng; selectedCoords = { lat, lng };
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([lat, lng], { icon: L.divIcon({ html: '<div style="background:#FFD523;width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>', iconSize: [28, 28], iconAnchor: [14, 14] }) }).addTo(map);
    document.getElementById('latDisplay').textContent = lat.toFixed(7);
    document.getElementById('lngDisplay').textContent = lng.toFixed(7);
    updateSubmitButton();
});

function updateSubmitButton() {
    const form = document.getElementById('locationForm');
    const path1 = document.getElementById('connectedPath').value !== '';
    const routeCount = parseInt(document.getElementById('routeCount').value);
    
    let allPathsValid = path1;
    if (routeCount >= 2) allPathsValid = allPathsValid && document.getElementById('connectedPath2').value !== '';
    if (routeCount >= 3) allPathsValid = allPathsValid && document.getElementById('connectedPath3').value !== '';
    if (routeCount >= 4) allPathsValid = allPathsValid && document.getElementById('connectedPath4').value !== '';
    
    document.getElementById('submitBtn').disabled = !(form.checkValidity() && selectedCoords && allPathsValid);
}

document.querySelectorAll('#locationForm input, #locationForm select, #locationForm textarea').forEach(el => { 
    el.addEventListener('input', updateSubmitButton); 
    el.addEventListener('change', updateSubmitButton); 
});

document.getElementById('locationForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 
    if (!selectedCoords) return alert('Select location');
    
    const routeCount = parseInt(document.getElementById('routeCount').value);
    const path1 = document.getElementById('connectedPath').value;
    const path2 = document.getElementById('connectedPath2').value;
    const path3 = document.getElementById('connectedPath3').value;
    const path4 = document.getElementById('connectedPath4').value;
    
    const paths = [path1];
    if (routeCount >= 2 && path2) paths.push(path2);
    if (routeCount >= 3 && path3) paths.push(path3);
    if (routeCount >= 4 && path4) paths.push(path4);
    
const connectedPath = paths;  // <-- real array
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    
    try {
        if (editingLocationId) {
            // UPDATE MODE
            submitBtn.textContent = 'Updating...';
            
            const locData = {
                name: document.getElementById('locationName').value.trim() || 'Unnamed Location', 
                building: document.getElementById('building').value || 'Unknown Building',
    connected_path: connectedPath.length > 0 ? connectedPath : ['main_pathway'],  // ✅ NEW - always returns array
                type: document.getElementById('locationType').value || 'room',
                floor: document.getElementById('floor').value || 'Ground Floor', 
                category: document.getElementById('category').value || 'location', 
                access_type: document.getElementById('accessType').value || 'internal',
                dual_pathways: routeCount > 1,
                description: document.getElementById('description').value.trim() || '',
                image_urls: uploadedImages.length > 0 ? uploadedImages : null,
                latitude: selectedCoords.lat,
                longitude: selectedCoords.lng
            };
            
            const { data, error } = await supabase
                .from('campus_locations')
                .update(locData)
                .eq('id', editingLocationId)
                .select();
            
            if (error) {
                console.error('Supabase error:', error);
                alert('Error updating database: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Location';
                return;
            }
            
            // Update local location
            const locIndex = locations.findIndex(l => l.id === editingLocationId);
            if (locIndex !== -1) {
                // Remove old marker
                if (locations[locIndex].marker) {
                    map.removeLayer(locations[locIndex].marker);
                }
                
                // Update location data
                locations[locIndex] = {
                    id: editingLocationId,
                    name: locData.name,
                    building: locData.building,
                    connected_path: paths,
                    type: locData.type,
                    floor: locData.floor,
                    category: locData.category,
                    access_type: locData.access_type,
                    dual_pathways: routeCount > 1,
                    description: locData.description,
                    images: uploadedImages,
                    coordinates: [locData.longitude, locData.latitude]
                };
                
                // Add new marker
                addPermanentMarker(locations[locIndex]);
                
                // Rebuild list
                rebuildList();
            }
            
            alert('✓ Location updated successfully!');
            
        } else {
            // INSERT MODE
            submitBtn.textContent = 'Saving...';
            
            const locData = {
                id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: document.getElementById('locationName').value.trim() || 'Unnamed Location', 
                building: document.getElementById('building').value || 'Unknown Building',
                connected_path: connectedPath || 'main_pathway', 
                type: document.getElementById('locationType').value || 'room',
                floor: document.getElementById('floor').value || 'Ground Floor', 
                category: document.getElementById('category').value || 'location', 
                access_type: document.getElementById('accessType').value || 'internal',
                dual_pathways: routeCount > 1,
                description: document.getElementById('description').value.trim() || '',
                image_urls: uploadedImages.length > 0 ? uploadedImages : null,
                latitude: selectedCoords.lat,
                longitude: selectedCoords.lng
            };
            
            const { data, error } = await supabase
                .from('campus_locations')
                .insert([locData])
                .select();
            
            if (error) {
                console.error('Supabase error:', error);
                alert('Error saving to database: ' + error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add Location';
                return;
            }
            
            const loc = {
                id: locData.id,
                name: locData.name,
                building: locData.building,
                connected_path: paths,
                type: locData.type,
                floor: locData.floor,
                category: locData.category,
                access_type: locData.access_type,
                dual_pathways: routeCount > 1,
                description: locData.description,
                images: uploadedImages,
                coordinates: [locData.longitude, locData.latitude]
            };
            
            locations.push(loc); 
            addLocationToList(loc); 
            addPermanentMarker(loc); 
            alert('✓ Location saved successfully!');
        }
        
        clearForm(); 
        
    } catch (err) {
        console.error('Error:', err);
        alert('Failed to save location. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = editingLocationId ? 'Update Location' : 'Add Location';
    }
});

document.getElementById('clearBtn').addEventListener('click', clearForm);

function clearForm() {
    document.getElementById('locationForm').reset();
    document.getElementById('latDisplay').textContent = 'Click map'; 
    document.getElementById('lngDisplay').textContent = 'or use Location';
    document.getElementById('routeCount').value = '1';
    document.getElementById('secondPathGroup').style.display = 'none';
    document.getElementById('thirdPathGroup').style.display = 'none';
    document.getElementById('fourthPathGroup').style.display = 'none';
    document.getElementById('connectedPath2').required = false;
    document.getElementById('connectedPath3').required = false;
    document.getElementById('connectedPath4').required = false;
    uploadedImages = [];
    updateImagePreview();
    if (currentMarker) { map.removeLayer(currentMarker); currentMarker = null; }
    selectedCoords = null; 
    highlightPaths([]); 
    updateSubmitButton();
    
    // Reset edit mode
    editingLocationId = null;
    document.getElementById('editModeBanner').style.display = 'none';
    document.getElementById('submitBtn').textContent = 'Add Location';
}

function addPermanentMarker(loc) {
    const color = typeColors[loc.type] || '#3C9AFB';
    const marker = L.marker([loc.coordinates[1], loc.coordinates[0]], { 
        icon: L.divIcon({ 
            html: `<div style="background:${color};width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`, 
            iconSize: [22, 22], 
            iconAnchor: [11, 11] 
        }) 
    }).addTo(map);
    marker.bindPopup(`<b>${loc.name}</b><br>${loc.building}<br>${loc.floor}<br><i>${loc.access_type}</i>`);
    loc.marker = marker;
}

function addLocationToList(loc) {
    const list = document.getElementById('locationsList');
    if (locations.length === 1) list.innerHTML = '';
    
    const pathDisplay = Array.isArray(loc.connected_path) ? loc.connected_path.join(' + ') : loc.connected_path;
    
    const imagesHTML = loc.images && loc.images.length > 0 ? 
        `<div class="location-images">${loc.images.map(img => `<img src="${img}" alt="Location image">`).join('')}</div>` : '';
    
    const item = document.createElement('div'); 
    item.className = 'location-item';
    item.innerHTML = `<div class="location-item-header"><div><h4>${loc.name}</h4><span class="badge">${loc.type.toUpperCase()}</span><span class="badge category">${loc.category.toUpperCase()}</span><span class="badge access">${loc.access_type.toUpperCase()}</span></div><div><button class="btn-edit" onclick="editLocation('${loc.id}')">✏️ Edit</button><button class="btn-delete" onclick="deleteLocation('${loc.id}')">✕</button></div></div><p><b>Building:</b> ${loc.building} | <b>Floor:</b> ${loc.floor}</p><p><b>Path:</b> ${pathDisplay}</p>${loc.dual_pathways ? '<p>✓ Dual Pathways</p>' : ''}${loc.description ? `<p>${loc.description}</p>` : ''}${imagesHTML}<p style="font-size:0.65rem;color:#9ca3af">[${loc.coordinates[0].toFixed(6)}, ${loc.coordinates[1].toFixed(6)}]</p>`;
    list.appendChild(item);
    document.getElementById('locationCount').textContent = locations.length;
}

function deleteLocation(id) {
    if (!confirm('Are you sure you want to delete this location?')) return;
    
    const i = locations.findIndex(l => l.id === id);
    if (i !== -1) { 
        // Delete from Supabase
        deleteFromSupabase(id);
        
        // Remove marker from map
        if (locations[i].marker) map.removeLayer(locations[i].marker); 
        
        // Remove from local array
        locations.splice(i, 1); 
        rebuildList(); 
    }
}

function editLocation(id) {
    const loc = locations.find(l => l.id === id);
    if (!loc) return;
    
    // Set editing mode
    editingLocationId = id;
    document.getElementById('editModeBanner').style.display = 'block';
    document.getElementById('submitBtn').textContent = 'Update Location';
    
    // Populate form fields
    document.getElementById('locationName').value = loc.name;
    document.getElementById('building').value = loc.building;
    document.getElementById('locationType').value = loc.type;
    document.getElementById('floor').value = loc.floor;
    document.getElementById('category').value = loc.category;
    document.getElementById('accessType').value = loc.access_type;
    document.getElementById('description').value = loc.description || '';
    
    // Handle connected paths
    if (Array.isArray(loc.connected_path)) {
        const pathCount = loc.connected_path.length;
        document.getElementById('routeCount').value = pathCount.toString();
        
        // First set the route count visibility
        updateRouteFields();  // <-- ADDED THIS LINE
        
        // Then populate the path values
        document.getElementById('connectedPath').value = loc.connected_path[0] || '';
        
        if (pathCount >= 2) {
            document.getElementById('connectedPath2').value = loc.connected_path[1] || '';
        }
        
        if (pathCount >= 3) {
            document.getElementById('connectedPath3').value = loc.connected_path[2] || '';
        }
        
        if (pathCount >= 4) {
            document.getElementById('connectedPath4').value = loc.connected_path[3] || '';
        }
        
        // Delay highlighting to ensure all fields are populated
        setTimeout(() => {
            highlightPaths(loc.connected_path);
        }, 100);
    } else {
        document.getElementById('routeCount').value = '1';
        updateRouteFields();  // <-- ADDED THIS LINE
        document.getElementById('connectedPath').value = loc.connected_path;
        setTimeout(() => {
            highlightPaths([loc.connected_path]);
        }, 100);
    }
    
    // Set coordinates
    selectedCoords = { lat: loc.coordinates[1], lng: loc.coordinates[0] };
    document.getElementById('latDisplay').textContent = selectedCoords.lat.toFixed(7);
    document.getElementById('lngDisplay').textContent = selectedCoords.lng.toFixed(7);
    
    // Update marker
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([selectedCoords.lat, selectedCoords.lng], { 
        icon: L.divIcon({ 
            html: '<div style="background:#3C9AFB;width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>', 
            iconSize: [28, 28], 
            iconAnchor: [14, 14] 
        }) 
    }).addTo(map);
    
    // Set images
    uploadedImages = loc.images || [];
    updateImagePreview();
    
    // Zoom to location
    map.setView([selectedCoords.lat, selectedCoords.lng], 19);
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    updateSubmitButton();
}

async function deleteFromSupabase(id) {
    try {
        const { error } = await supabase
            .from('campus_locations')
            .delete()
            .eq('id', id);
        
        if (error) {
            console.error('Error deleting from database:', error);
            alert('Location removed locally but failed to delete from database');
        } else {
            console.log('Location deleted from database:', id);
        }
    } catch (err) {
        console.error('Failed to delete location:', err);
    }
}

function rebuildList() {
    const list = document.getElementById('locationsList');
    list.innerHTML = locations.length ? '' : '<div class="empty-state">No locations yet</div>';
    locations.forEach(l => addLocationToList(l));
    document.getElementById('locationCount').textContent = locations.length;
}

function exportData() {
    const geojson = { 
        type: 'FeatureCollection', 
        features: locations.map(({ marker, ...l }) => ({ 
            type: 'Feature', 
            properties: { 
                id: l.id, 
                name: l.name, 
                building: l.building, 
                connected_path: l.connected_path, 
                type: l.type, 
                floor: l.floor, 
                category: l.category, 
                access_type: l.access_type, 
                ...(l.dual_pathways && { dual_pathways: true }), 
                ...(l.description && { description: l.description }),
                ...(l.images && { images: l.images })
            }, 
            geometry: { 
                type: 'Point', 
                coordinates: l.coordinates 
            } 
        })) 
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(blob); 
    link.download = 'campus_locations.geojson'; 
    link.click();
}