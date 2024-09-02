let map;
let bounds;
let pinCounter = 1;
let markers = [];
let currentInfoWindow;
let cepsNaoEncontrados = 0;
let selectedColor = document.getElementById("pin-color").value;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -14.235004, lng: -51.92528 }, // Centraliza o mapa no Brasil
    zoom: 5,
  });
  bounds = new google.maps.LatLngBounds();
}

const colorSelect = document.getElementById("pin-color");

colorSelect.addEventListener("change", function () {
  selectedColor = this.value; // Update selectedColor variable
  console.log("Selected color:", selectedColor);
});

function addPins() {
  console.log("addPins function called");
  const addresses = document.getElementById("address").value.trim().split("\n");

  console.log("Endereços:", addresses); // Verifica a lista de endereços

  let count = 0;
  addresses.forEach((address) => {
    if (address) {
      geocodeAddress(address, selectedColor, () => {
        count++;
        if (count === addresses.length) {
          if (markers.length > 1) {
            map.fitBounds(bounds);
          } else {
            map.fitBounds(bounds); // Use fitBounds em vez de setCenter e setZoom
            map.setZoom(12); // Ajuste o zoom para um valor mais razoável
          }
        }
      });
    }
  });
  setTimeout(() => {
    if (cepsNaoEncontrados > 0) {
      alert(`Não foi possível encontrar ${cepsNaoEncontrados} CEP(s).`);
      cepsNaoEncontrados = 0;
    }
  }, 1000); // aguarda 1 segundo para mostrar a mensagem
  document.getElementById("address").value = ""; // Limpa o campo de endereço
  clearInputField(); // Chama a função clearInputField() para limpar o campo de endereço
}

function geocodeAddress(address, selectedColor, callback) {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: address }, function (results, status) {
    console.log("Status da geocodificação:", status); // Verifica o status da geocodificação
    if (status === "OK") {
      const location = results[0].geometry.location;
      bounds.extend(results[0].geometry.location);
      console.log("Localização encontrada:", location); // Verifica a localização encontrada

      const marker = new google.maps.Marker({
        map: map,
        position: location,
        icon: `http://maps.google.com/mapfiles/ms/icons/${selectedColor}-dot.png`, // Use selectedColor aqui
      });

      markers.push(marker);

      const listItem = document.createElement("li");
      const pinIcon = document.createElement("img");
      pinIcon.src = `http://maps.google.com/mapfiles/ms/icons/${selectedColor}-dot.png`;
      listItem.appendChild(pinIcon);
      listItem.appendChild(
        document.createTextNode(
          `Pin ${pinCounter}: ${results[0].formatted_address}`
        )
      );
      listItem.dataset.index = pinCounter - 1;

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "X";
      deleteButton.onclick = (event) => {
        const index = event.target.parentElement.getAttribute("data-index");
        removePin(index);
      };
      listItem.appendChild(deleteButton);

      listItem.onclick = function () {
        const index = parseInt(this.dataset.index);
        highlightPin(index);
      };

      document.getElementById("list").appendChild(listItem);

      // Abre janela de informações
      const infowindow = new google.maps.InfoWindow({
        content: `<strong>${results[0].formatted_address}</strong>`,
        maxWidth: 200,
        maxHeight: 100, // Adicione essa linha
      });
      marker.infowindow = infowindow;

      // Add a click event listener to the marker
      marker.addListener("click", function () {
        if (currentInfoWindow) {
          currentInfoWindow.close();
        }
        currentInfoWindow = infowindow;
        infowindow.open(map, marker);
      });

      pinCounter++;
      callback(); // Chama o callback após o processamento do endereço
    } else {
      console.log("Erro ao geocodificar endereço:", address); // Verifica erros de geocodificação
      cepsNaoEncontrados++;
    }
  });
}

function highlightPin(index) {
  if (currentInfoWindow) {
    currentInfoWindow.close();
  }
  const marker = markers[index];
  if (marker && marker.getVisible()) {
    map.panTo(marker.getPosition());
    currentInfoWindow = marker.infowindow;
    marker.infowindow.open(map, marker);
    highlightListItem(index);
  }
}

function highlightListItem(index) {
  const listItems = document.querySelectorAll("#list li");
  listItems.forEach((item) => item.classList.remove("highlight"));

  const listItem = document.querySelector(`#list li[data-index='${index}']`);
  if (listItem) {
    listItem.classList.add("highlight");
    listItem.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function clearInput() {
  document.getElementById("address").value = "";
  document.getElementById("list").innerHTML = "";
  pinCounter = 1;
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  bounds = new google.maps.LatLngBounds();
  map.setCenter({ lat: -14.235004, lng: -51.92528 });
  map.setZoom(5);
}

function clearInputField() {
  document.getElementById("address").value = "";
}

function removePin(index) {
  if (index >= 0 && index < markers.length) {
    markers[index].setMap(null);
    markers.splice(index, 1);
    document.querySelector(`#list li[data-index='${index}']`).remove();

    const listItems = document.querySelectorAll("#list li");
    listItems.forEach((item, idx) => {
      item.dataset.index = idx;
      item.querySelector("button").onclick = function () {
        removePin(idx);
      };
    });

    bounds = new google.maps.LatLngBounds();
  }
}

const textarea = document.getElementById("address");

textarea.addEventListener("keydown", function (event) {
  console.log("Tecla pressionada:", event.key);

  if (event.key === "Enter" && document.activeElement === textarea) {
    if (!event.shiftKey) {
      // Verifica se a tecla Shift está sendo pressionada
      console.log("Enter pressionado!");
      event.preventDefault(); // Cancela o evento para evitar que o cursor pule para a próxima linha
      addPins();
    }
  }
});

const colorFilterSelect = document.getElementById("color-filter");

colorFilterSelect.addEventListener("change", function () {
  const selectedColor = this.value;
  const listItems = document.querySelectorAll("#list li");

  if (selectedColor === "all") {
    listItems.forEach((item) => (item.style.display = "block"));
    markers.forEach((marker) => marker.setVisible(true));
  } else {
    listItems.forEach((item) => {
      const pinColor = item
        .querySelector("img")
        .src.split("/")
        .pop()
        .split("-")[0];
      if (pinColor === selectedColor) {
        item.style.display = "block";
        const markerIndex = item.dataset.index;
        markers[markerIndex].setVisible(true);
      } else {
        item.style.display = "none";
        const markerIndex = item.dataset.index;
        markers[markerIndex].setVisible(false);
      }
    });
  }
});
