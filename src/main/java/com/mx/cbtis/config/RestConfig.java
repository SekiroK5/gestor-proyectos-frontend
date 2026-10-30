package com.mx.cbtis.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestConfig {

	// Un solo cliente HTTP para hablar con la API del gestor (antes se creaba uno en cada metodo).
	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}
}
