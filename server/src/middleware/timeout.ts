/**
 * Request timeout middleware
 * Prevents resource exhaustion from hanging connections
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout triggered', { 
          method: req.method, 
          url: req.originalUrl,
          timeoutMs 
        });
        res.status(504).json({
          success: false,
          error: {
            message: 'Request timed out',
            statusCode: 504
          }
        });
      }
    }, timeoutMs);

    const cleanup = () => clearTimeout(timer);

    res.on('finish', cleanup);
    res.on('close', cleanup);
    res.on('error', cleanup);
    
    next();
  };
}

export default requestTimeout;
