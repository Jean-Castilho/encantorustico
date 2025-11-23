
/**
 * @file Gerencia a interatividade do painel de controle de entregas, 
 * incluindo a seleção de pedidos, a exibição de detalhes e a integração 
 * com o mapa para visualização e rastreamento de rotas.
 * @author Jean Castilho
 */

/**
 * Inicializa o mapa e os serviços do Google Maps.
 * Esta função é chamada como callback quando a API do Google Maps é carregada.
 */
function initMap() {
    const deliveryDashboard = new DeliveryDashboard();
    deliveryDashboard.init();
}

class DeliveryDashboard {
    constructor() {
        this.orderId = null;
        this.address_client = null;
        this.geocoder = null;
        this.map = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.markerA = null; // Marcador para a origem (entregador)
        this.markerB = null; // Marcador para o destino (cliente)
        this.locationWatchId = null;

        // Elementos da UI
        this.orderList = document.getElementById('order-list');
        this.emptyState = document.getElementById('empty-state');
        this.orderDetailsInfo = document.getElementById('order-details-info');
        this.locationBtn = document.getElementById('location-btn');
        this.sendCodeBtn = document.getElementById('send-code-btn');
        this.confirmDeliveryBtn = document.getElementById('confirm-delivery-btn');
        this.otpSection = this.confirmDeliveryBtn.parentElement;
        this.traceRouteBtn = document.getElementById('trace-route-btn');
        this.viewOnMapBtn = document.getElementById('view-on-map-btn');
    }

    /**
     * Inicializa os componentes do painel de controle.
     */
    init() {
        this.initMap();
        this.initEventListeners();
        this.checkInitialOrders();
    }

    /**
     * Inicializa o mapa e os serviços associados.
     */
    initMap() {
        try {
            this.directionsService = new google.maps.DirectionsService();
            this.directionsRenderer = new google.maps.DirectionsRenderer();
            this.geocoder = new google.maps.Geocoder();

            const initialLatLng = { lat: -22.8894, lng: -42.0286 }; // Coordenadas padrão
            this.map = new google.maps.Map(document.getElementById("map-placeholder"), {
                zoom: 11,
                center: initialLatLng,
            });
            this.directionsRenderer.setMap(this.map);
        } catch (error) {
            console.error("Error initializing map:", error);
            document.getElementById("map-placeholder").innerHTML = `
                <div style="padding: 20px;">
                    <h3>Erro ao carregar o mapa</h3>
                    <p>Verifique a chave da API do Google Maps e as configurações do projeto.</p>
                    <p>Erro: ${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Configura os event listeners para a lista de pedidos e botões de ação.
     */
    initEventListeners() {
        if (this.orderList) {
            this.orderList.addEventListener('click', this.handleOrderSelection.bind(this));
        }

        this.locationBtn.addEventListener('click', this.toggleLocationTracking.bind(this));
        this.sendCodeBtn.addEventListener('click', this.enviarCodigo.bind(this));
        this.confirmDeliveryBtn.addEventListener('click', this.confirmarEntrega.bind(this));
        this.traceRouteBtn.addEventListener('click', this.traceRoute.bind(this));
        this.viewOnMapBtn.addEventListener('click', this.viewOnMap.bind(this));
    }

    /**
     * Lida com a seleção de um pedido na lista.
     * @param {Event} event - O evento de clique.
     */
    handleOrderSelection(event) {
        const cardElement = event.target.closest('.order-card');
        if (!cardElement) return;

        // Desmarca todos os cartões e seleciona o clicado
        document.querySelectorAll('.order-card.selected').forEach(card => card.classList.remove('selected'));
        cardElement.classList.add('selected');

        // Exibe os detalhes do pedido
        this.emptyState.classList.add('hidden');
        this.orderDetailsInfo.classList.add('visible');

        const orderData = JSON.parse(cardElement.dataset.order);
        this.updateOrderDetails(orderData);

        this.orderId = orderData._id;
        this.address_client = `${orderData.endereco.rua}, ${orderData.endereco.numero} - ${orderData.endereco.bairro}, ${orderData.endereco.cidade}, ${orderData.endereco.estado}, ${orderData.endereco.cep}`;
    }

    /**
     * Atualiza a seção de detalhes do pedido com as informações do pedido selecionado.
     * @param {object} orderData - Os dados do pedido.
     */

    updateOrderDetails(orderData) {
        document.getElementById('detail-client-name').innerHTML = `<strong>Cliente:</strong> ${orderData.user.name}`;
        document.getElementById('number').value = orderData.user.number;
        document.getElementById('detail-address').innerHTML = `<strong>Endereço:</strong> ${orderData.endereco.rua}, ${orderData.endereco.numero}, ${orderData.endereco.bairro}`;
        document.getElementById('detail-status').innerHTML = `<strong>Status:</strong> <span class="order-status status-${orderData.status.toLowerCase().replace(' ', '-')}">${orderData.status}</span>`;
    
        const deliveryConfirmationSection = this.sendCodeBtn.closest('.details-confirmation');
        let confirmedMessage = document.getElementById('delivery-confirmed-message');
        
        if (!confirmedMessage) {
            confirmedMessage = document.createElement('div');
            confirmedMessage.id = 'delivery-confirmed-message';
            confirmedMessage.style.display = 'none';
            confirmedMessage.classList.add('info-item'); 
            deliveryConfirmationSection.appendChild(confirmedMessage);
        }

        if (orderData.status.toLowerCase() === 'entregue') {
            this.sendCodeBtn.style.display = 'none';
            this.otpSection.style.display = 'none';
            confirmedMessage.innerHTML = '<strong>Entrega já foi confirmada.</strong>';
            confirmedMessage.style.display = 'block';
        } else {
            this.sendCodeBtn.style.display = 'block';
            this.otpSection.style.display = 'none';
            confirmedMessage.style.display = 'none';
        }
    }

    /**
     * Verifica se há pedidos na lista e exibe uma mensagem apropriada se não houver.
     */
    checkInitialOrders() {
        if (this.orderList && this.orderList.children.length === 0) {
            this.emptyState.innerHTML = `
                <span class="material-icons">inbox</span>
                <h3>Nenhum Pedido Disponível</h3>
                <p>Volte mais tarde para verificar novas entregas.</p>`;
        }
    }

    /**
     * Traça e exibe a rota entre a localização do entregador e o endereço do cliente.
     */
    traceRoute() {
        if (!this.markerA) {
            this.showNotification('Primeiro, obtenha sua localização clicando em "Obter Localização".', 'error');
            return;
        }
        if (!this.address_client) {
            this.showNotification('Selecione um pedido para definir o destino.', 'error');
            return;
        }

        const request = {
            origin: this.markerA.getPosition(),
            destination: this.address_client,
            travelMode: google.maps.TravelMode.DRIVING
        };

        this.directionsService.route(request, (response, status) => {
            if (status === 'OK') {
                this.directionsRenderer.setDirections(response);
                if (this.markerA) this.markerA.setMap(null);
                if (this.markerB) this.markerB.setMap(null);
            } else {
                this.showNotification('Falha ao traçar a rota: ' + status, 'error');
            }
        });
    }

    /**
     * Ativa ou desativa o rastreamento da localização do entregador.
     */
    toggleLocationTracking() {
        if (this.locationWatchId) {
            // Para o rastreamento
            navigator.geolocation.clearWatch(this.locationWatchId);
            this.locationWatchId = null;
            this.locationBtn.textContent = 'Obter Localização';
            this.locationBtn.classList.replace('btn-destaque', 'btn-secundario');
        } else {
            // Inicia o rastreamento
            if (navigator.geolocation) {
                const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
                this.locationWatchId = navigator.geolocation.watchPosition(
                    this.updateLocation.bind(this),
                    this.handleLocationError.bind(this),
                    options
                );
                this.locationBtn.textContent = 'Parar Rastreamento';
                this.locationBtn.classList.replace('btn-secundario', 'btn-destaque');
            } else {
                this.showNotification("Seu navegador não suporta geolocalização.", 'error');
            }
        }
    }

    /**
     * Atualiza a posição do marcador do entregador no mapa.
     * @param {GeolocationPosition} position - O objeto de posição geográfica.
     */
    updateLocation(position) {
        const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        if (this.markerA) {
            this.markerA.setPosition(pos);
        } else {
            this.map.setCenter(pos);
            this.map.setZoom(16);
            this.markerA = new google.maps.Marker({
                position: pos,
                map: this.map,
                title: 'Sua localização'
            });
        }

        this.reverseGeocode(pos, (address) => {
            document.getElementById('origin').value = address || `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`;
        });
    }

    /**
     * Lida com erros ao obter a localização.
     * @param {GeolocationPositionError} error - O objeto de erro de geolocalização.
     */
    handleLocationError(error) {
        this.showNotification("Não foi possível obter sua localização. Verifique as permissões do navegador.", 'error');
        this.locationWatchId = null;
        this.locationBtn.textContent = 'Obter Localização';
        this.locationBtn.classList.replace('btn-destaque', 'btn-secundario');
    }

    /**
     * Converte coordenadas geográficas em um endereço legível.
     * @param {google.maps.LatLng} latLng - As coordenadas a serem geocodificadas.
     * @param {function(string|null)} callback - A função de callback.
     */
    reverseGeocode(latLng, callback) {
        this.geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK' && results[0]) {
                callback(results[0].formatted_address);
            } else {
                callback(null);
            }
        });
    }

    /**
     * Exibe o endereço do cliente no mapa.
     */
    viewOnMap() {
        if (!this.address_client) {
            this.showNotification('Por favor, selecione um pedido para ver o endereço no mapa.', 'error');
            return;
        }

        this.directionsRenderer.setDirections({ routes: [] });
        if (this.markerA) this.markerA.setMap(null);

        this.geocoder.geocode({ address: this.address_client }, (results, status) => {
            if (status === 'OK') {
                const destinationLocation = results[0].geometry.location;
                this.map.setCenter(destinationLocation);
                this.map.setZoom(16);

                if (!this.markerB) {
                    this.markerB = new google.maps.Marker({
                        position: destinationLocation,
                        map: this.map,
                        title: 'Destino'
                    });
                } else {
                    this.markerB.setPosition(destinationLocation);
                    this.markerB.setMap(this.map);
                }
            } else {
                this.showNotification('A geocodificação do endereço falhou: ' + status, 'error');
            }
        });
    }

    async enviarCodigo() {
        const number = document.getElementById('number').value;
        if (!number) {
            this.showNotification('Por favor, selecione um pedido antes de enviar o código.', 'error');
            return;
        }

        this.sendCodeBtn.disabled = true;
        this.sendCodeBtn.textContent = 'Enviando...';

        try {
            const response = await fetch("/sendCodforDelivery", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number })
            });

            if (response.ok) {
                this.sendCodeBtn.style.display = 'none';
                this.otpSection.style.display = 'block';
                this.showNotification('Código de confirmação enviado para o cliente!', 'success');
            } else {
                const resCod = await response.json();
                this.showNotification(`Erro ao enviar código: ${resCod.message || 'Erro desconhecido.'}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar código:', error);
            this.showNotification('Não foi possível conectar ao servidor para enviar o código. Tente novamente.', 'error');
        } finally {
            this.sendCodeBtn.disabled = false;
            this.sendCodeBtn.textContent = 'Enviar Codigo';
        }
    }

    async confirmarEntrega() {
        const number = document.getElementById('number').value;
        const code = document.getElementById('OtpToClient').value;

        if (!code || code.length < 4) {
            this.showNotification('Por favor, insira um código de confirmação válido.', 'error');
            return;
        }

        this.confirmDeliveryBtn.disabled = true;
        this.confirmDeliveryBtn.textContent = 'Confirmando...';

        try {
            const response = await fetch("/confirmDelivery", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, code })
            });

            const result = await response.json();

            if (response.ok) {
                this.showNotification('Entrega confirmada com sucesso!', 'success');
                // Atualiza a UI para refletir o novo status
                const selectedCard = this.orderList.querySelector('.order-card.selected');
                if (selectedCard) {
                    const orderData = JSON.parse(selectedCard.dataset.order);
                    orderData.status = 'Entregue';
                    selectedCard.dataset.order = JSON.stringify(orderData); // Atualiza os dados no elemento
                    this.updateOrderDetails(orderData); // Re-renderiza os detalhes
                }
            } else {
                this.showNotification(result.message || 'Falha ao confirmar a entrega.', 'error');
            }
        } catch (error) {
            console.error('Erro ao confirmar entrega:', error);
            this.showNotification('Erro de conexão ao confirmar a entrega. Tente novamente.', 'error');
        } finally {
            this.confirmDeliveryBtn.disabled = false;
            this.confirmDeliveryBtn.textContent = 'Confirmar Entrega';
        }
    }

    showNotification(message, type = 'info') {
        // Esta função pode ser implementada para mostrar um toast/snackbar em vez de um alert.
        // Por simplicidade, usaremos alert por enquanto, mas com a estrutura pronta para substituição.
        alert(`[${type.toUpperCase()}] ${message}`);
    }

}
