import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Import marketing images
import instagramPostDashboard from "@/assets/marketing/instagram-post-dashboard.png";
import instagramStoryWhatsapp from "@/assets/marketing/instagram-story-whatsapp.png";
import facebookCover from "@/assets/marketing/facebook-cover.png";
import instagramCarouselFeatures from "@/assets/marketing/instagram-carousel-features.png";

interface MarketingImage {
  id: string;
  name: string;
  description: string;
  dimensions: string;
  platform: string;
  src: string;
  filename: string;
}

const marketingImages: MarketingImage[] = [
  {
    id: "1",
    name: "Post Instagram - Dashboard",
    description: "Imagem quadrada mostrando o dashboard do MedFlow",
    dimensions: "1024 x 1024",
    platform: "Instagram Feed",
    src: instagramPostDashboard,
    filename: "instagram-post-dashboard.png",
  },
  {
    id: "2",
    name: "Story Instagram - WhatsApp",
    description: "Story vertical com notificação de WhatsApp",
    dimensions: "608 x 1088",
    platform: "Instagram Stories",
    src: instagramStoryWhatsapp,
    filename: "instagram-story-whatsapp.png",
  },
  {
    id: "3",
    name: "Capa Facebook",
    description: "Banner panorâmico para capa do Facebook",
    dimensions: "1920 x 1088",
    platform: "Facebook Cover",
    src: facebookCover,
    filename: "facebook-cover.png",
  },
  {
    id: "4",
    name: "Carrossel Instagram - Features",
    description: "Imagem com 3 telas mostrando funcionalidades",
    dimensions: "1024 x 1024",
    platform: "Instagram Carousel",
    src: instagramCarouselFeatures,
    filename: "instagram-carousel-features.png",
  },
];

const MarketingGallery = () => {
  const handleDownload = (image: MarketingImage) => {
    const link = document.createElement("a");
    link.href = image.src;
    link.download = image.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    marketingImages.forEach((image, index) => {
      setTimeout(() => {
        handleDownload(image);
      }, index * 500);
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Galeria de Marketing
            </h1>
            <p className="text-muted-foreground">
              Imagens promocionais para suas redes sociais
            </p>
          </div>
          <Button onClick={handleDownloadAll} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Todas
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {marketingImages.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                <img
                  src={image.src}
                  alt={image.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">{image.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {image.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium">Plataforma:</span>{" "}
                      {image.platform}
                    </p>
                    <p>
                      <span className="font-medium">Dimensões:</span>{" "}
                      {image.dimensions}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(image)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarketingGallery;
