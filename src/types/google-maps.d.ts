declare namespace google {
  namespace maps {
    namespace places {
      class Autocomplete {
        constructor(
          input: HTMLInputElement,
          opts?: AutocompleteOptions
        );
        addListener(eventName: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }

      interface AutocompleteOptions {
        types?: string[];
      }

      interface PlaceResult {
        formatted_address?: string;
        address_components?: AddressComponent[];
      }

      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }
    }
  }
}

interface Window {
  google?: typeof google;
}
