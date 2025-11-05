let orderId;
let address_client;
let geocoder;
let map;
let directionsService;
let directionsRenderer;
let markerA = null;
let markerB = null;
// Definindo ícones. Pode ser URLs para imagens customizadas ou deixar null para o padrão.
let iconA = null;
let iconB = null;
let locationWatchId = null;

function tracarRota() {

    if (!markerA) {
        alert('Primeiro, obtenha sua localização clicando em "Obter Localização".');
        return;
    }

    if (!address_client) {
        alert('Selecione um pedido para definir o destino.');
        return;
    }

    const origin = markerA.getPosition();

    const destination = address_client;

    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);

            if (markerA) markerA.setMap(null);
            if (markerB) markerB.setMap(null);

            const leg = response.routes[0].legs[0];
            if (!markerB) {
                markerB = new google.maps.Marker({
                    position: leg.end_location,
                    map: map,
                    icon: iconB,
                    title: 'Destino'
                });
            } else {
                markerB.setPosition(leg.end_location);
                if (!markerB.getMap()) {
                    markerB.setMap(map);
                }
            }

        } else {
            window.alert('Falha ao traçar a rota: ' + status);
        }
    });

}

function toggleLocationTracking() {
    const locationBtn = document.getElementById('location-btn');

    if (locationWatchId) {
        // Stop tracking
        navigator.geolocation.clearWatch(locationWatchId);
        locationWatchId = null;
        locationBtn.textContent = 'Obter Localização';
        locationBtn.classList.remove('btn-destaque');
        locationBtn.classList.add('btn-secundario');
        console.log("Rastreamento de localização parado.");
    } else {
        // Start tracking
        if (navigator.geolocation) {
            const options = {
                enableHighAccuracy: true,
                timeout: 10000, // 10 seconds
                maximumAge: 0
            };

            locationWatchId = navigator.geolocation.watchPosition(position => {
                console.log("Localização atualizada:", position);
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                if (markerA) {
                    markerA.setPosition(pos);
                } else {
                    // First time getting location, center map and create marker
                    map.setCenter(pos);
                    map.setZoom(16);
                    markerA = new google.maps.Marker({
                        position: pos,
                        map: map,
                        icon: iconA,
                        title: 'Origem (Sua localização)'
                    });
                }

                // Update the origin input field with the address
                reverseGeocode(pos, (address) => {
                    document.getElementById('origin').value = address || `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
                });

                // Update button state
                locationBtn.textContent = 'Parar Rastreamento';
                locationBtn.classList.remove('btn-secundario');
                locationBtn.classList.add('btn-destaque');

            }, error => {
                console.error("Erro ao rastrear a localização: ", error);
                alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
                // Reset state if tracking fails to start
                locationWatchId = null;
                locationBtn.textContent = 'Obter Localização';
                locationBtn.classList.remove('btn-destaque');
                locationBtn.classList.add('btn-secundario');
            }, options);

            console.log("Iniciando rastreamento de localização...");

        } else {
            alert("Seu navegador não suporta geolocalização.");
        }
    }
}

function reverseGeocode(latLng, callback) {
    if (!geocoder) {
        callback(null);
        return;
    }

    geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {

            console.log(results[0].formatted_address);

            callback(results[0].formatted_address);
        } else {
            callback(null);
        }
    })
}

function initMap() {

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    geocoder = new google.maps.Geocoder();

    const myLatLng = { lat: -22.8894, lng: -42.0286 };
    map = new google.maps.Map(document.getElementById("map-placeholder"), {
        zoom: 11,
        center: myLatLng,
    });
    directionsRenderer.setMap(map);

};

document.addEventListener('DOMContentLoaded', () => {
    const orderList = document.getElementById('order-list');
    const emptyState = document.getElementById('empty-state');
    const orderDetailsInfo = document.getElementById('order-details-info');

    if (!orderList) return;

    orderList.addEventListener('click', (event) => {
        const cardElement = event.target.closest('.order-card');
        if (!cardElement) return;

        document.querySelectorAll('.order-card').forEach(card => card.classList.remove('selected'));
        cardElement.classList.add('selected');

        emptyState.classList.add('hidden');
        orderDetailsInfo.classList.add('visible');

        const orderData = JSON.parse(cardElement.dataset.order);
        document.getElementById('detail-client-name').innerHTML = `<strong>Cliente:</strong> ${orderData.user.name}`;
        document.getElementById('number').value = orderData.user.number;
        document.getElementById('detail-address').innerHTML = `<strong>Endereço:</strong> ${orderData.endereco.rua}, ${orderData.endereco.numero}, ${orderData.endereco.bairro}`;
        document.getElementById('detail-status').innerHTML = `<strong>Status:</strong> <span class="order-status status-${orderData.status.toLowerCase().replace(' ', '-')}">${orderData.status}</span>`;

        address_client = `${orderData.endereco.rua} - ${orderData.endereco.bairro}, ${orderData.endereco.cidade}, ${orderData.endereco.estado}, ${orderData.endereco.cep}`;

        console.log('Endereço do cliente:', address_client);
    });

    if (orders.length === 0) {
        emptyState.innerHTML = `
            <span class="material-icons"> inbox </span>
            <h3>Nenhum Pedido Disponível</h3>
            <p>Volte mais tarde para verificar novas entregas.</p>`;
    }
});

async function vernoMapa() {
    if (!address_client) {
        alert('Por favor, selecione um pedido para ver o endereço no mapa.');
        return;
    }

    if (!geocoder) {
        alert('O serviço de geocodificação não está pronto.');
        return;
    }

    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
    }

    if (markerA) {
        markerA.setMap(null);
    }

    geocoder.geocode({ 'address': address_client }, (results, status) => {
        if (status === 'OK') {
            const destinationLocation = results[0].geometry.location;
            map.setCenter(destinationLocation);
            map.setZoom(16);

            if (!markerB) {
                markerB = new google.maps.Marker({
                    position: destinationLocation,
                    map: map,
                    icon: iconB,
                    title: 'Destino'
                });
            } else {
                markerB.setPosition(destinationLocation);
                markerB.setMap(map);
            }
        } else {
            alert('A geocodificação do endereço falhou pelo seguinte motivo: ' + status);
        }
    });
}



async function enviarCodigo() {

    let number = document.getElementById('number').value;
    console.log(number);
    const response = await fetch("/sendCodforDelivery", {
        method: 'POST',
        headers: {
            'content-Type': 'application/json'
        },
        body: JSON.stringify({ number })
    })



    const resCod = await response.json();
    console.log(resCod);
}

async function confirmarEntrega() {
    const confirmDeliverd = await fetch("/confirmDelivery", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ number, code })
    })
    console.log(confirmDeliverd);
}
