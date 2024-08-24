let map;
let bounds;
let pinCounter = 1;
let markers = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -14.235004, lng: -51.92528 }, // Centraliza o mapa no Brasil
        zoom: 5
    });
    bounds = new google.maps.LatLngBounds();
}

function addPins() {
    const input = document.getElementById('address').value;
    // Divide a entrada em múltiplos endereços usando quebra de linha como separador
    const addresses = input.split('\n').map(addr => addr.trim());
    const color = document.getElementById('pin-color').value;

    // Log para depuração
    console.log('Endereços:', addresses);
    console.log('Cor selecionada:', color);

    addresses.forEach(address => {
        if (address) {
            geocodeAddress(address, color);
        }
    });
    clearInputField();
}

function geocodeAddress(address, color) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, function(results, status) {
        if (status === 'OK') {
            const location = results[0].geometry.location;
            bounds.extend(location);

            const marker = new google.maps.Marker({
                map: map,
                position: location,
                icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
            });

            markers.push(marker);

            const listItem = document.createElement('li');
            const pinIcon = document.createElement('img');
            pinIcon.src = `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
            listItem.appendChild(pinIcon);
            listItem.appendChild(document.createTextNode(`Pin ${pinCounter}: ${results[0].formatted_address}`));
            listItem.dataset.index = pinCounter - 1;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.onclick = (event) => {
                const index = event.target.parentElement.getAttribute('data-index');
                removePin(index);
            };
            listItem.appendChild(deleteButton);

            listItem.onclick = function () {
                highlightPin(pinCounter - 1);
            };

            document.getElementById('list').appendChild(listItem);

            map.fitBounds(bounds);
            map.setZoom(14);

            marker.addListener('click', function () {
                map.setZoom(14);
                map.setCenter(marker.getPosition());
                highlightListItem(pinCounter - 1);
            });

            pinCounter++;
        } else {
            console.error("Geocode was not successful for the following reason: " + status);
        }
    });
}

function highlightListItem(index) {
    const listItems = document.querySelectorAll('#list li');
    listItems.forEach(item => item.classList.remove('highlight'));

    const listItem = document.querySelector(`#list li[data-index='${index}']`);
    if (listItem) {
        listItem.classList.add('highlight');
        listItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function highlightMarker(index) {
    markers.forEach(marker => marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png'));

    const marker = markers[index];
    if (marker) {
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
        map.setZoom(14);
        map.setCenter(marker.getPosition());
    }
}

function highlightPin(index) {
    highlightListItem(index);
    highlightMarker(index);
}
 
function clearInput() {
    document.getElementById("address").value = '';
    document.getElementById("list").innerHTML = '';
    pinCounter = 1;
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    bounds = new google.maps.LatLngBounds();
    map.setCenter({ lat: -14.235004, lng: -51.92528 });
    map.setZoom(5);
}

function clearInputField() {
    document.getElementById("address").value = '';
}

function removePin(index) {
    if (index >= 0 && index < markers.length) {
        // Remove o marcador do mapa
        markers[index].setMap(null);

        // Remove o marcador do array
        markers.splice(index, 1);

        // Remove o item da lista
        document.querySelector(`#list li[data-index='${index}']`).remove();

        // Atualiza os índices dos pins restantes
        const listItems = document.querySelectorAll('#list li');
        listItems.forEach((item, idx) => {
            item.dataset.index = idx;
            item.querySelector('button').onclick = function () {
                removePin(idx);
            };
        });

        // Recalcula os bounds e ajusta o zoom
        bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);

        if (markers.length > 0) {
            map.setZoom(14); // Ajusta o zoom para visão de bairro
        } else {
            map.setZoom(5); // Zoom inicial se não houver pins
        }
    }
}

document.getElementById('address').addEventListener('keypress', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        addPins();
    } else if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        const input = document.getElementById('address');
        const cursorPos = input.selectionStart;
        const value = input.value;
        input.value = value.slice(0, cursorPos) + '\n' + value.slice(cursorPos);
        input.selectionStart = cursorPos + 1;
        input.selectionEnd = cursorPos + 1;
    }
});

