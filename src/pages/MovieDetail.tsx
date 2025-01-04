import { useState } from "react";
import { useParams } from "react-router-dom";
import { Play, Star, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MovieDetail = () => {
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen pt-16">
      <div className="relative h-[70vh]">
        {isPlaying ? (
          <div className="absolute inset-0 bg-black">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=2000&q=80)`
              }}
            >
              <div className="hero-gradient" />
            </div>
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4">
                <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
                  Movie Title
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-300 mb-6">
                  <span>2024</span>
                  <span>2h 15m</span>
                  <span>Drama</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-netflix-gold mr-1" />
                    <span>4.5</span>
                  </div>
                </div>
                <p className="text-lg text-gray-300 mb-8 max-w-xl">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <div className="flex space-x-4">
                  <Button 
                    size="lg" 
                    className="bg-netflix-red hover:bg-netflix-red/90"
                    onClick={() => setIsPlaying(true)}
                  >
                    <Play className="mr-2 h-5 w-5" /> Play Now
                  </Button>
                  <Button size="lg" variant="outline">
                    <MessageSquare className="mr-2 h-5 w-5" /> Comments
                  </Button>
                  <Button size="lg" variant="outline">
                    <Share2 className="mr-2 h-5 w-5" /> Share
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Movie Details */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">About the Movie</h2>
            <p className="text-gray-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">Cast & Crew</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Director</h3>
                <p className="text-gray-300">Director Name</p>
              </div>
              <div>
                <h3 className="font-medium">Writers</h3>
                <p className="text-gray-300">Writer Name</p>
              </div>
              <div>
                <h3 className="font-medium">Stars</h3>
                <p className="text-gray-300">Actor Name, Actor Name, Actor Name</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;