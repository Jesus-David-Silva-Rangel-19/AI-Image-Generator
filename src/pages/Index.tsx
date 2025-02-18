
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedKey = localStorage.getItem("replicate_api_key");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem("replicate_api_key", value);
  };

  const generateImage = async () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu API key de Replicate",
        variant: "destructive",
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "Error",
        description: "Por favor, ingresa una descripción para la imagen",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${apiKey}`,
        },
        body: JSON.stringify({
          version: "a28d793df9322a8ec4bba32106e6a5eec22aec9bb783c9f06aaed981833021f0",
          input: { prompt },
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar la imagen");
      }

      const prediction = await response.json();
      
      // Poll for the result
      let result;
      while (!result) {
        const statusResponse = await fetch(
          `https://api.replicate.com/v1/predictions/${prediction.id}`,
          {
            headers: {
              Authorization: `Token ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        
        if (!statusResponse.ok) {
          throw new Error("Error al verificar el estado de la generación");
        }

        const statusData = await statusResponse.json();
        if (statusData.status === "succeeded") {
          result = statusData.output[0];
          setImage(result);
        } else if (statusData.status === "failed") {
          throw new Error("Error en la generación de la imagen");
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      toast({
        title: "¡Éxito!",
        description: "Imagen generada correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un error al generar la imagen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="font-title text-4xl font-extrabold text-gray-900 mb-2">
            Generador de Imágenes AI
          </h1>
          <p className="font-body text-lg text-gray-600 mb-8">
            Crea imágenes asombrosas con inteligencia artificial
          </p>
        </div>

        <Card className="p-6 backdrop-blur-sm bg-white/80 border border-gray-200 shadow-sm">
          <div className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="font-body text-sm text-gray-700 block mb-2">
                API Key de Replicate
              </label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                className="font-mono"
                placeholder="Ingresa tu API key..."
              />
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block transition-colors"
              >
                Obtener API key
              </a>
            </div>

            <div>
              <label htmlFor="prompt" className="font-body text-sm text-gray-700 block mb-2">
                Descripción de la Imagen
              </label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="font-body"
                placeholder="Describe la imagen que deseas generar..."
              />
            </div>

            <Button
              onClick={generateImage}
              disabled={loading}
              className="w-full font-body"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar Imagen"
              )}
            </Button>
          </div>
        </Card>

        {image && (
          <Card className="p-6 backdrop-blur-sm bg-white/80 border border-gray-200 shadow-sm">
            <img
              src={image}
              alt="Imagen generada"
              className="w-full h-auto rounded-lg shadow-md"
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
