import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Apple, Smartphone, Music, Send, Wallet, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/Logo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-body text-foreground">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
        <Link to="/" className="flex items-center ml-5">
          <Logo size="2xl" />
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#artistas" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">Para Artistas</a>
          <a href="#fas" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">Para Fãs</a>
          <a href="#bares" className="text-sm font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">Para Bares</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/explore">
            <Button variant="ghost" className="hidden md:flex font-bold hover:bg-white/5">
              Explorar
            </Button>
          </Link>
          <Link to="/explore">
            <Button className="btn-gradient px-6 rounded-full font-black uppercase tracking-widest text-xs">
              Acessar Web
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-6 md:px-12 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-live-indicator animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80">Plataforma Oficial</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tighter leading-[0.9] max-w-5xl mx-auto mb-8"
          >
            A Revolução da <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">
              Música ao Vivo
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
          >
            Conectamos fãs, artistas e bares. Peça músicas, envie gorjetas via PIX na hora e contrate talentos para o seu evento. Tudo em um só app.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col w-full items-center justify-center max-w-lg mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-4 w-full mb-4">
              <Button className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-lg gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)] group">
                <Apple className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                App Store
              </Button>
              <Button className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-black text-lg gap-3 backdrop-blur-md group">
                <Play className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="currentColor" />
                Google Play
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Aplicativo exclusivo para Artistas e Donos de Bar
            </p>
          </motion.div>
        </section>

        {/* Features / Como Funciona */}
        <section className="py-24 px-6 md:px-12 bg-black/40 border-t border-white/5 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-heading font-black text-4xl md:text-5xl tracking-tight mb-4">
                Como <span className="text-primary">Funciona</span>
              </h2>
              <p className="text-muted-foreground text-lg">Um ecossistema criado para valorizar o artista independente.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <motion.div 
                whileHover={{ y: -8 }}
                className="p-8 rounded-[2rem] glass-card group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-6 shadow-inner text-primary">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-black text-2xl tracking-tight mb-3">Para o Fã</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Escaneie o QR Code na mesa do bar, escolha a música do cardápio digital do artista e pague o couver ou gorjeta na hora via PIX.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                whileHover={{ y: -8 }}
                className="p-8 rounded-[2rem] glass-card group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-secondary/20 transition-colors" />
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20 mb-6 shadow-inner text-secondary">
                  <Wallet className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-black text-2xl tracking-tight mb-3">Para o Artista</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Seu palco virtual. Aceite pedidos, crie seu setlist, feche contratos diretos e receba suas gorjetas com liquidez e transparência.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                whileHover={{ y: -8 }}
                className="p-8 rounded-[2rem] glass-card group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-400/20 transition-colors" />
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center border border-amber-400/20 mb-6 shadow-inner text-amber-400">
                  <Star className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-black text-2xl tracking-tight mb-3">Para o Bar</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Encontre e contrate os melhores músicos da sua região através do nosso marketplace. Facilite o pagamento de cachês e modernize a experiência do seu cliente.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 md:px-12 flex justify-center">
          <div className="w-full max-w-5xl rounded-[3rem] p-12 md:p-20 relative overflow-hidden text-center glass-card border border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-left">
              <div className="flex-1">
                <p className="text-primary font-black uppercase tracking-widest text-sm mb-3">Para Profissionais</p>
                <h2 className="font-heading font-black text-4xl md:text-5xl tracking-tighter mb-4">
                  O Palco é Seu
                </h2>
                <p className="text-lg text-white/80 mb-8 max-w-md">
                  Baixe o aplicativo oficial para gerenciar sua agenda, aceitar pedidos de músicas, recolher gorjetas via PIX e conectar seu bar com os melhores talentos.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-sm gap-2">
                    <Apple className="w-5 h-5" /> App Store
                  </Button>
                  <Button className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-black text-sm gap-2">
                    <Play className="w-5 h-5" fill="currentColor" /> Google Play
                  </Button>
                </div>
              </div>
              
              <div className="hidden md:block w-px h-40 bg-white/10" />

              <div className="flex-1">
                <p className="text-secondary font-black uppercase tracking-widest text-sm mb-3">Para o Público</p>
                <h2 className="font-heading font-black text-4xl md:text-5xl tracking-tighter mb-4">
                  É só apontar a câmera
                </h2>
                <p className="text-lg text-white/80 max-w-md">
                  Sem downloads, sem senhas. Apenas escaneie o QR Code na mesa do bar, escolha a música e envie sua gorjeta na hora pelo navegador do celular. O link único do QR Code te leva direto para a página de pedidos do artista que está no palco.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest relative z-10">
        © {new Date().getFullYear()} TocaMais. Todos os direitos reservados.
      </footer>
    </div>
  );
}
