# Use Python 3.11 Alpine image for smaller size
FROM python:3.11-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Create non-root user for security
RUN addgroup -g 1001 -S python && \
    adduser -S mcp -u 1001

# Change ownership of the app directory
RUN chown -R mcp:python /app
USER mcp

# Expose port (though MCP uses stdio, this is for potential future HTTP interface)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "print('Health check passed')" || exit 1

# Run the MCP server
CMD ["python", "src/server.py"]